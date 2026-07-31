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
    var aviDifficulty: NSString = "friendly" { didSet { render() } }
    var accountAvailable = false { didSet { render() } }
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
    var playerDisplayName: NSString = "" { didSet { render() } }
    var activeProvider: NSString = "" { didSet { render() } }
    var authError: NSString = "" { didSet { render() } }
    var authInitiallyPresented = false { didSet { render() } }
    var hapticsEnabled = true { didSet { render() } }
    var gameLanguage: NSString = "en" { didSet { render() } }
    var subscriptionBusy = false { didSet { render() } }
    var subscriptionError: NSString = "" { didSet { render() } }
    var subscriptionPrice: NSString = "" { didSet { render() } }
    var subscriptionState: NSString = "unavailable" { didSet { render() } }
    var onAction: RCTBubblingEventBlock?

    private var hostingController: UIHostingController<AnyView>?
    private var renderModel: DuelWordsSharedAppleRenderModel?

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
        guard !(surface as String).isEmpty else { return }

        let props = DuelWordsSharedSurfaceProps(
            surface: surface as String,
            selectedTab: selectedTab as String,
            interfaceLocale: interfaceLocale as String,
            appearance: appearance as String,
            aviDifficulty: aviDifficulty as String,
            accountAvailable: accountAvailable,
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
            playerDisplayName: playerDisplayName as String,
            activeProvider: activeProvider as String,
            authError: authError as String,
            authInitiallyPresented: authInitiallyPresented,
            hapticsEnabled: hapticsEnabled,
            gameLanguage: gameLanguage as String,
            subscriptionBusy: subscriptionBusy,
            subscriptionError: subscriptionError as String,
            subscriptionPrice: subscriptionPrice as String,
            subscriptionState: subscriptionState as String
        ).applyingSimulatorUITestOverrides()
        if let renderModel {
            renderModel.props = props
            return
        }

        let model = DuelWordsSharedAppleRenderModel(props: props)
        let rootView = AnyView(
            DuelWordsSharedAppleRenderHost(model: model) { [weak self] action, value in
                guard !DuelWordsSimulatorUITestRuntime.shouldSuppress(action: action) else { return }
                var payload: [String: Any] = ["action": action]
                if let value { payload["value"] = value }
                self?.onAction?(payload)
            }
        )

        let controller = UIHostingController(rootView: rootView)
        controller.view.backgroundColor = .clear
        controller.overrideUserInterfaceStyle = resolvedInterfaceStyle
        controller.view.overrideUserInterfaceStyle = resolvedInterfaceStyle
        controller.view.frame = bounds
        controller.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(controller.view)
        renderModel = model
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

private final class DuelWordsSharedAppleRenderModel: ObservableObject {
    @Published var props: DuelWordsSharedSurfaceProps

    init(props: DuelWordsSharedSurfaceProps) {
        self.props = props
    }
}

private struct DuelWordsSharedAppleRenderHost: View {
    @ObservedObject var model: DuelWordsSharedAppleRenderModel
    let action: DuelWordsSharedAction

    var body: some View {
        DuelWordsSharedSurfaceRoot(props: model.props, action: action)
    }
}

struct DuelWordsSharedSurfaceProps {
    let surface: String
    let selectedTab: String
    let interfaceLocale: String
    let appearance: String
    let aviDifficulty: String
    let accountAvailable: Bool
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
    let playerDisplayName: String
    let activeProvider: String
    let authError: String
    let authInitiallyPresented: Bool
    let hapticsEnabled: Bool
    let gameLanguage: String
    let subscriptionBusy: Bool
    let subscriptionError: String
    let subscriptionPrice: String
    let subscriptionState: String
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
            aviDifficulty: aviDifficulty,
            accountAvailable: true,
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
            playerDisplayName: playerDisplayName,
            activeProvider: activeProvider,
            authError: authError,
            authInitiallyPresented: authInitiallyPresented,
            hapticsEnabled: hapticsEnabled,
            gameLanguage: gameLanguage,
            subscriptionBusy: subscriptionBusy,
            subscriptionError: subscriptionError,
            subscriptionPrice: subscriptionPrice,
            subscriptionState: subscriptionState
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
