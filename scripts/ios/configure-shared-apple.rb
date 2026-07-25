# frozen_string_literal: true

require 'pathname'
require 'xcodeproj'

module DuelWordsSharedApple
  SWIFT_FIVE_COMPATIBILITY_TARGETS = %w[RNScreens ExpoLinking].freeze
  PRODUCTS = %w[
    AVBrandFoundation
    AVAppShellFoundation
    AVLaunchFoundation
    AVSettingsFoundation
    AVAviFoundation
    AVPaywallFoundation
  ].freeze

  def self.configure(project_path:, target_name:, source_root:, apps_av_path:)
    project_path = File.expand_path(project_path)
    source_root = File.expand_path(source_root)
    apps_av_path = File.expand_path(apps_av_path)
    raise "Xcode project not found: #{project_path}" unless File.directory?(project_path)
    raise "Shared Apple source root not found: #{source_root}" unless File.directory?(source_root)
    unless File.file?(File.join(apps_av_path, 'Package.swift'))
      raise "Apps AV Swift package not found: #{apps_av_path}"
    end

    project = Xcodeproj::Project.open(project_path)
    target = project.targets.find { |candidate| candidate.name == target_name }
    raise "Target not found: #{target_name}" unless target

    app_group = project.main_group.find_subpath(target_name, true)
    shared_group = app_group.find_subpath('SharedApple', true)
    shared_group.set_source_tree('<group>')
    # Expo's app group is virtual: its existing file references already include
    # the target directory in their paths. Keep this generated group consistent
    # so Xcode resolves sources from ios/DuelWordsAV/SharedApple.
    shared_group.path = File.join(target_name, 'SharedApple')

    Dir.glob(File.join(source_root, '*.{swift,m}')).sort.each do |source_path|
      filename = File.basename(source_path)
      file_reference = shared_group.files.find { |candidate| candidate.path == filename }
      file_reference ||= shared_group.new_file(filename)
      unless target.source_build_phase.files_references.include?(file_reference)
        target.source_build_phase.add_file_reference(file_reference, true)
      end
    end

    project_directory = File.dirname(project_path)
    package_relative_path = Pathname.new(apps_av_path).relative_path_from(Pathname.new(project_directory)).to_s
    package_reference = project.root_object.package_references.find do |candidate|
      candidate.is_a?(Xcodeproj::Project::Object::XCLocalSwiftPackageReference) &&
        candidate.relative_path == package_relative_path
    end
    unless package_reference
      package_reference = project.new(Xcodeproj::Project::Object::XCLocalSwiftPackageReference)
      package_reference.relative_path = package_relative_path
      project.root_object.package_references << package_reference
    end

    PRODUCTS.each do |product_name|
      dependency = target.package_product_dependencies.find { |candidate| candidate.product_name == product_name }
      unless dependency
        dependency = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
        dependency.package = package_reference
        dependency.product_name = product_name
        target.package_product_dependencies << dependency
      end

      next if target.frameworks_build_phase.files.any? { |build_file| build_file.product_ref == dependency }

      build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
      build_file.product_ref = dependency
      target.frameworks_build_phase.files << build_file
    end

    target.build_configurations.each do |configuration|
      configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '18.0'
      # Keep the Expo host in Swift 5 language mode. The linked Apps AV Swift
      # package declares and compiles with its own Swift tools version, while
      # several pinned Expo pods are not strict-concurrency clean in Swift 6.
      configuration.build_settings['SWIFT_VERSION'] = '5.0'
    end

    project.save
    Pod::UI.puts "Configured #{target_name} with Apps AV shared Swift products and #{shared_group.files.length} bridge sources."
  end

  def self.configure_pods(project)
    # RNScreens Gamma is required by Expo Router and ExpoLinking backs routing,
    # but these pinned releases are not yet Swift 6 isolation-safe in Xcode 26.
    # The Expo app target is also pinned to Swift 5 above. Apply the same
    # compatibility mode to these generated pod targets until their upstream
    # concurrency annotations land.
    configured_targets = project.targets.select do |candidate|
      SWIFT_FIVE_COMPATIBILITY_TARGETS.include?(candidate.name)
    end
    configured_targets.each do |target|
      target.build_configurations.each do |configuration|
        configuration.build_settings['SWIFT_VERSION'] = '5.0'
      end
    end
    Pod::UI.puts "Configured Swift compatibility for #{configured_targets.map(&:name).join(', ')}."
  end
end
