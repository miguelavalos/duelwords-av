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
        )
        if let renderModel {
            renderModel.props = props
            return
        }

        let model = DuelWordsSharedAppleRenderModel(props: props)
        let rootView = AnyView(
            DuelWordsSharedAppleRenderHost(model: model) { [weak self] action, value in
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
