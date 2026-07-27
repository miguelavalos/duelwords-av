import Foundation
import React
import SwiftUI
import UIKit

@objc(DuelWordsSharedAppleViewManager)
final class DuelWordsSharedAppleViewManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! {
        DuelWordsSharedAppleHostView()
    }
}

@objc(DuelWordsSimulatorUITestRuntime)
final class DuelWordsSimulatorUITestRuntimeModule: NSObject {
    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc func constantsToExport() -> [AnyHashable: Any] {
        let accountMode = DuelWordsSimulatorUITestRuntime.accountMode()
        return [
            "accountMode": accountMode ?? "",
            "enabled": accountMode != nil
        ]
    }
}

@objcMembers
final class DuelWordsSharedAppleHostView: UIView {
    var surface: NSString = "" { didSet { render() } }
    var selectedTab: NSString = "play" { didSet { render() } }
    var interfaceLocale: NSString = "en" { didSet { render() } }
    var appearance: NSString = "system" {
        didSet {
            applyAppearanceOverride()
            render()
        }
    }
    var accountAvailable = false { didSet { render() } }
    var adsPrivacyOptionsRequired = false { didSet { render() } }
    var signedIn = false { didSet { render() } }
    var displayName: NSString = "" { didSet { render() } }
    var deletionBlockersJSON: NSString = "[]" { didSet { render() } }
    var deletionBusy = false { didSet { render() } }
    var deletionCanFinalize = false { didSet { render() } }
    var deletionError: NSString = "" { didSet { render() } }
    var deletionStatus: NSString = "" { didSet { render() } }
    var deletionWarningsJSON: NSString = "[]" { didSet { render() } }
    var email: NSString = "" { didSet { render() } }
    var planTier: NSString = "free" { didSet { render() } }
    var activeProvider: NSString = "" { didSet { render() } }
    var authError: NSString = "" { didSet { render() } }
    var authInitiallyPresented = false { didSet { render() } }
    var hapticsEnabled = true { didSet { render() } }
    var onAction: RCTBubblingEventBlock?

    private var hostingController: UIHostingController<AnyView>?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        applyAppearanceOverride()
        render()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .clear
        applyAppearanceOverride()
        render()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        attachHostingControllerIfNeeded()
        hostingController?.view.frame = bounds
    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        attachHostingControllerIfNeeded()
    }

    override func removeFromSuperview() {
        hostingController?.willMove(toParent: nil)
        hostingController?.removeFromParent()
        super.removeFromSuperview()
    }

    private func render() {
        let props = DuelWordsSharedSurfaceProps(
            surface: surface as String,
            selectedTab: selectedTab as String,
            interfaceLocale: interfaceLocale as String,
            appearance: appearance as String,
            accountAvailable: accountAvailable,
            adsPrivacyOptionsRequired: adsPrivacyOptionsRequired,
            signedIn: signedIn,
            displayName: displayName as String,
            deletionBlockersJSON: deletionBlockersJSON as String,
            deletionBusy: deletionBusy,
            deletionCanFinalize: deletionCanFinalize,
            deletionError: deletionError as String,
            deletionStatus: deletionStatus as String,
            deletionWarningsJSON: deletionWarningsJSON as String,
            email: email as String,
            planTier: planTier as String,
            activeProvider: activeProvider as String,
            authError: authError as String,
            authInitiallyPresented: authInitiallyPresented,
            hapticsEnabled: hapticsEnabled
        ).applyingSimulatorUITestOverrides()
        let rootView = AnyView(
            DuelWordsSharedSurfaceRoot(props: props) { [weak self] action, value in
                guard !DuelWordsSimulatorUITestRuntime.shouldSuppress(action: action) else { return }
                var payload: [String: Any] = ["action": action]
                if let value { payload["value"] = value }
                self?.onAction?(payload)
            }
        )

        if let hostingController {
            hostingController.rootView = rootView
            return
        }

        let controller = UIHostingController(rootView: rootView)
        controller.view.backgroundColor = .clear
        controller.overrideUserInterfaceStyle = resolvedInterfaceStyle
        controller.view.overrideUserInterfaceStyle = resolvedInterfaceStyle
        controller.view.frame = bounds
        controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(controller.view)
        hostingController = controller
        attachHostingControllerIfNeeded()
    }

    private func attachHostingControllerIfNeeded() {
        guard let hostingController, hostingController.parent == nil,
              let parentViewController = nearestViewController() else { return }

        parentViewController.addChild(hostingController)
        hostingController.didMove(toParent: parentViewController)
        hostingController.view.setNeedsLayout()
        hostingController.view.layoutIfNeeded()
    }

    private func applyAppearanceOverride() {
        let style = resolvedInterfaceStyle
        overrideUserInterfaceStyle = style
        hostingController?.overrideUserInterfaceStyle = style
        hostingController?.view.overrideUserInterfaceStyle = style
    }

    private var resolvedInterfaceStyle: UIUserInterfaceStyle {
        switch appearance as String {
        case "light": .light
        case "dark": .dark
        default: .unspecified
        }
    }

    private func nearestViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while let current = responder {
            if let viewController = current as? UIViewController {
                return viewController
            }
            responder = current.next
        }
        return nil
    }
}

struct DuelWordsSharedSurfaceProps {
    let surface: String
    let selectedTab: String
    let interfaceLocale: String
    let appearance: String
    let accountAvailable: Bool
    let adsPrivacyOptionsRequired: Bool
    let signedIn: Bool
    let displayName: String
    let deletionBlockersJSON: String
    let deletionBusy: Bool
    let deletionCanFinalize: Bool
    let deletionError: String
    let deletionStatus: String
    let deletionWarningsJSON: String
    let email: String
    let planTier: String
    let activeProvider: String
    let authError: String
    let authInitiallyPresented: Bool
    let hapticsEnabled: Bool
}

private extension DuelWordsSharedSurfaceProps {
    func applyingSimulatorUITestOverrides(
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> DuelWordsSharedSurfaceProps {
#if targetEnvironment(simulator)
        guard let accountMode = DuelWordsSimulatorUITestRuntime.accountMode(environment: environment) else {
            return self
        }

        let deletion = Self.deletionFixture(
            environment["DUELWORDSAV_UI_TEST_ACCOUNT_DELETION"]?.lowercased()
        )
        return DuelWordsSharedSurfaceProps(
            surface: surface,
            selectedTab: selectedTab,
            interfaceLocale: interfaceLocale,
            appearance: appearance,
            accountAvailable: true,
            adsPrivacyOptionsRequired: adsPrivacyOptionsRequired,
            signedIn: true,
            displayName: "UI Test User",
            deletionBlockersJSON: deletion.blockers,
            deletionBusy: false,
            deletionCanFinalize: deletion.canFinalize,
            deletionError: deletion.error,
            deletionStatus: deletion.status,
            deletionWarningsJSON: deletion.warnings,
            email: "ui-test@example.test",
            planTier: accountMode == "pro" ? "pro" : "free",
            activeProvider: activeProvider,
            authError: authError,
            authInitiallyPresented: authInitiallyPresented,
            hapticsEnabled: hapticsEnabled
        )
#else
        return self
#endif
    }

    static func deletionFixture(_ scenario: String?) -> (
        blockers: String,
        canFinalize: Bool,
        error: String,
        status: String,
        warnings: String
    ) {
        switch scenario {
        case "blocked":
            return (
                blockers: #"[{"type":"eligibilityUnavailable","label":"Account AV needs your review","detail":"Open Account AV and resolve the issue before trying again.","managementUrl":null}]"#,
                canFinalize: false,
                error: "",
                status: "blocked",
                warnings: "[]"
            )
        case "completed":
            return ("[]", false, "", "completed", "[]")
        case "error":
            return ("[]", false, "We could not check whether the account can be deleted. No account changes were made.", "", "[]")
        case "inprogress":
            return (
                "[]",
                true,
                "",
                "inProgress",
                #"[{"type":"deletionInProgress","label":"Deletion request received","detail":"You can now finish the final account deletion step.","managementUrl":null}]"#
            )
        case "eligible":
            return (
                "[]",
                false,
                "",
                "eligible",
                #"[{"type":"linkedApp","label":"Connected Apps AV","detail":"Review local game data separately on each device.","managementUrl":null}]"#
            )
        default:
            return ("[]", false, "", "", "[]")
        }
    }
}

private enum DuelWordsSimulatorUITestRuntime {
    private static let suppressedActions: Set<String> = [
        "confirmDelete",
        "continueGuest",
        "finalizeDelete",
        "refreshAccount",
        "retry",
        "signInApple",
        "signInGoogle",
        "signOut"
    ]

    static func accountMode(
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> String? {
#if targetEnvironment(simulator)
        guard environment["DUELWORDSAV_UI_TESTS"] == "1" else { return nil }
        let accountMode = environment["DUELWORDSAV_UI_TESTS_ACCOUNT_MODE"]?.lowercased()
        return accountMode == "free" || accountMode == "pro" ? accountMode : nil
#else
        return nil
#endif
    }

    static func shouldSuppress(
        action: String,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> Bool {
        accountMode(environment: environment) != nil && suppressedActions.contains(action)
    }
}
