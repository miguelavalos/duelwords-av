import AVAppShellFoundation
import AVAviFoundation
import AVBrandFoundation
import AVPaywallFoundation
import AVSettingsFoundation
import Foundation
import SwiftUI
import UIKit

typealias DuelWordsSharedAction = (_ action: String, _ value: String?) -> Void

struct DuelWordsSharedSurfaceRoot: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        Group {
            switch props.surface {
            case "splash":
                AVConfiguredSplashScreen()
            case "onboarding":
                DuelWordsOnboardingSurface(props: props, action: action)
            case "header":
                DuelWordsHeaderSurface(props: props, action: action)
            case "footer":
                DuelWordsFooterSurface(props: props, action: action)
            case "sidebar":
                DuelWordsSidebarSurface(props: props, action: action)
            case "settings":
                DuelWordsSettingsSurface(props: props, action: action)
            case "account":
                DuelWordsAccountSurface(props: props, action: action)
            case "paywall":
                DuelWordsPaywallSurface(props: props, action: action)
            case "delete-account":
                DuelWordsDeleteAccountSurface(props: props, action: action)
            default:
                Color.clear
            }
        }
        .avCommonAppExperience(DuelWordsAppExperience.experience)
        .tint(DuelWordsAppExperience.experience.brandPalette.accent)
        .modifier(DuelWordsAppearanceModifier(appearance: props.appearance))
    }
}

private struct DuelWordsAppearanceModifier: ViewModifier {
    let appearance: String

    @ViewBuilder
    func body(content: Content) -> some View {
        switch appearance {
        case "light":
            content.environment(\.colorScheme, .light)
        case "dark":
            content.environment(\.colorScheme, .dark)
        default:
            content
        }
    }
}

private struct DuelWordsOnboardingSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction
    @State private var authOptionsArePresented: Bool

    init(props: DuelWordsSharedSurfaceProps, action: @escaping DuelWordsSharedAction) {
        self.props = props
        self.action = action
        _authOptionsArePresented = State(initialValue: props.authInitiallyPresented)
    }

    var body: some View {
        AVAuthConfiguredOnboardingScreen(
            authOptionsArePresented: $authOptionsArePresented,
            primaryAction: showAuthOrSkip,
            secondaryAction: { action("skip", nil) },
            brandWidth: 160,
            ctaCompanionOffset: CGSize(width: -2, height: -112)
        ) {
            AVAuthOptionsPanel(
                title: "Connect your account",
                subtitle: "Use your Account AV account to continue across devices.",
                legalConsentText: legalConsentText,
                unavailableMessage: props.authError.isEmpty
                    ? (props.accountAvailable ? nil : "Local play remains available on this device.")
                    : props.authError,
                skipTitle: "Skip for now",
                appleTitle: "Continue with Apple",
                googleTitle: "Continue with Google",
                isBusy: !props.activeProvider.isEmpty,
                activeProvider: activeProvider,
                isAvailable: props.accountAvailable,
                appleAccessibilityIdentifier: "auth.apple",
                googleAccessibilityIdentifier: "auth.google",
                onApple: { action("signInApple", nil) },
                onGoogle: { action("signInGoogle", nil) },
                onSkip: { action("skip", nil) }
            ) {
                AVAuthConfiguredCompanionArtwork(
                    placement: .authPanel,
                    imageWidth: 126,
                    imageHeight: 126,
                    frameWidth: 140,
                    frameHeight: 110,
                    imageOffset: CGSize(width: 0, height: -5),
                    groundShadowColor: nil
                )
                .offset(x: -44, y: -91)
                .allowsHitTesting(false)
            }
        }
    }

    private func showAuthOrSkip() {
        if props.accountAvailable {
            withAnimation(.spring(response: 0.34, dampingFraction: 0.88)) {
                authOptionsArePresented = true
            }
        } else {
            action("skip", nil)
        }
    }

    private var activeProvider: AVAuthProvider? {
        switch props.activeProvider {
        case "apple": .apple
        case "google": .google
        default: nil
        }
    }

    private var legalConsentText: AttributedString {
        let markdown = "By continuing, you agree to the [Terms](https://duelwords-av.avalsys.com/terms/) and [Privacy Policy](https://duelwords-av.avalsys.com/privacy/) of DuelWords AV."
        return (try? AttributedString(markdown: markdown)) ?? AttributedString(markdown)
    }
}

private struct DuelWordsHeaderSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        AVAppShellConfiguredBrandHeader(
            activeItem: activeItem,
            settingsAccessibilityLabel: "Settings",
            accountAccessibilityLabel: "Account",
            openSettings: { action("settings", nil) },
            openAccount: { action("account", nil) }
        )
        .padding(.horizontal, 18)
    }

    private var activeItem: AVAppShellChromeItem? {
        switch props.selectedTab {
        case "settings": .settings
        case "account": .account
        default: nil
        }
    }
}

private struct DuelWordsFooterSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        AVAppShellFooter(
            selectedTabID: props.selectedTab,
            tabs: tabs,
            assistantID: "avi",
            assistantAccessibilityLabel: DuelWordsAppExperience.experience.identity.assistantName,
            assistantAccessibilityIdentifier: "footer.avi",
            footerConfiguration: .floating,
            onSelectTab: { action("tab", $0) },
            onSelectAssistant: { action("tab", "avi") },
            footerPlayer: { EmptyView() },
            assistantIcon: { _ in
                AVAppShellFooterAssistantAssetIcon(
                    assetName: DuelWordsAppExperience.experience.visualAssets?.footerAssistantName ?? "AviFooterIcon"
                )
            }
        )
    }

    private var tabs: [AVAppShellTab<String>] {
        [
            AVAppShellTab(id: "play", title: "Home", systemImage: "house.fill", accessibilityIdentifier: "footer.home"),
            AVAppShellTab(id: "rivals", title: "Rivals", systemImage: "person.2.fill", accessibilityIdentifier: "footer.rivals"),
            AVAppShellTab(id: "stats", title: "Stats", systemImage: "chart.bar.fill", accessibilityIdentifier: "footer.stats")
        ]
    }
}

private struct DuelWordsSidebarSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            AVAppShellTabletSidebarBrandHeader(
                logoAssetName: "DuelWordsHeaderLogo",
                accessibilityLabel: "DuelWords AV",
                logoWidth: 138,
                logoHeight: 44,
                logoLeadingCorrection: -16
            )
            .padding(.bottom, 12)

            sidebarButton("Home", systemImage: "house.fill", route: "play")
            sidebarButton("Rivals", systemImage: "person.2.fill", route: "rivals")
            sidebarButton("Stats", systemImage: "chart.bar.fill", route: "stats")
            sidebarButton("Avi", systemImage: "sparkles", route: "avi")

            Spacer(minLength: 16)

            sidebarButton("Settings", systemImage: "gearshape.fill", route: "settings", fontSize: 15)
            sidebarButton("Account", systemImage: "person.crop.circle.fill", route: "account", fontSize: 15)
        }
        .padding(.horizontal, AVAppShellTabletSidebarMetric.horizontalPadding)
        .padding(.vertical, AVAppShellTabletSidebarMetric.verticalPadding)
        .frame(width: 264, alignment: .topLeading)
        .frame(maxHeight: .infinity, alignment: .topLeading)
        .background(.regularMaterial)
        .accessibilityIdentifier("duelwords.shell.tablet.sidebar")
    }

    private func sidebarButton(_ title: String, systemImage: String, route: String, fontSize: CGFloat = 16) -> some View {
        AVAppShellTabletSidebarButton(
            title: title,
            systemImage: systemImage,
            isSelected: props.selectedTab == route,
            fontSize: fontSize,
            action: { action("tab", route) }
        )
        .accessibilityIdentifier("sidebar.\(route)")
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(title)
    }
}

private struct DuelWordsSettingsSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction
    @Environment(\.avBrandPalette) private var brandPalette
    @State private var didResetLocalData = false
    @State private var resetConfirmationIsPresented = false

    var body: some View {
        AVSettingsProfileScreenScaffold(
            title: "Settings",
            subtitle: "Preferences on this device, help, and legal information.",
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            showsTopSafeAreaShield: true,
            showsChrome: UIDevice.current.userInterfaceIdiom != .pad
        ) {
            DuelWordsHeaderSurface(
                props: DuelWordsSharedSurfaceProps(
                    surface: "header",
                    selectedTab: "settings",
                    interfaceLocale: props.interfaceLocale,
                    appearance: props.appearance,
                    accountAvailable: props.accountAvailable,
                    signedIn: props.signedIn,
                    displayName: props.displayName,
                    deletionBlockersJSON: props.deletionBlockersJSON,
                    deletionBusy: props.deletionBusy,
                    deletionCanFinalize: props.deletionCanFinalize,
                    deletionError: props.deletionError,
                    deletionStatus: props.deletionStatus,
                    deletionWarningsJSON: props.deletionWarningsJSON,
                    email: props.email,
                    planTier: props.planTier,
                    activeProvider: props.activeProvider,
                    authError: props.authError,
                    authInitiallyPresented: props.authInitiallyPresented,
                    hapticsEnabled: props.hapticsEnabled
                ),
                action: action
            )
        } content: {
            appPreferencesCard
            onDeviceCard
            helpCard
        }
        .confirmationDialog(
            "Reset local game data?",
            isPresented: $resetConfirmationIsPresented,
            titleVisibility: .visible
        ) {
            Button("Reset local game rotation", role: .destructive) {
                action("resetLocalData", nil)
                didResetLocalData = true
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This starts fresh local target decks. Your interface preferences and Account AV identity are not changed.")
        }
    }

    private var appPreferencesCard: some View {
        AVSettingsSectionCard(
            title: "App preferences",
            subtitle: "Choose how DuelWords AV appears on this device."
        ) {
            AVSettingsInfoRow(
                systemImage: "globe",
                title: "App language",
                detail: "Choose the language used by navigation, help, account, and game messages."
            )

            interfaceLanguageSelector

            AVSettingsInfoRow(
                systemImage: "circle.lefthalf.filled",
                title: "Appearance",
                detail: "Choose whether DuelWords AV follows the system or always uses a fixed appearance."
            )

            HStack(spacing: 10) {
                appearanceOption("System", value: "system", systemImage: "circle.lefthalf.filled")
                appearanceOption("Light", value: "light", systemImage: "sun.max.fill")
                appearanceOption("Dark", value: "dark", systemImage: "moon.fill")
            }

            AVSettingsToggleRow(
                systemImage: "iphone.radiowaves.left.and.right",
                title: "Haptics",
                detail: "Short feedback for selections and accepted local actions.",
                isOn: Binding(
                    get: { props.hapticsEnabled },
                    set: { action("setHaptics", $0 ? "true" : "false") }
                )
            )
        }
    }

    private var interfaceLanguageSelector: some View {
        Menu {
            ForEach(DuelWordsInterfaceLocaleOption.all) { locale in
                Button {
                    action("setInterfaceLocale", locale.id)
                } label: {
                    if props.interfaceLocale == locale.id {
                        Label(locale.menuTitle, systemImage: "checkmark")
                    } else {
                        Text(locale.menuTitle)
                    }
                }
            }
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(selectedInterfaceLocale.displayName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(AVBrandColor.textPrimary)
                    Text(selectedInterfaceLocale.autonym)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(AVBrandColor.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.up.chevron.down")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(brandPalette.accent)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(brandPalette.accent.opacity(0.07))
            )
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(brandPalette.accent.opacity(0.18), lineWidth: 1)
            }
        }
    }

    private var selectedInterfaceLocale: DuelWordsInterfaceLocaleOption {
        DuelWordsInterfaceLocaleOption.all.first(where: { $0.id == props.interfaceLocale })
            ?? DuelWordsInterfaceLocaleOption.all[0]
    }

    private var onDeviceCard: some View {
        AVSettingsSectionCard(
            title: "On this device",
            subtitle: "Local play remains separate from your shared Account AV identity."
        ) {
            AVSettingsInfoRow(systemImage: "app.badge", title: "Version", detail: "0.1.0 (1)")
            AVSettingsInfoRow(systemImage: "text.book.closed", title: "Word lists", detail: "Bundled EN, ES, CA, FR, and DE")
            AVSettingsInfoRow(systemImage: "arrow.triangle.2.circlepath", title: "Local targets", detail: "Shared no-repeat deck for Practice, Solo, and Play Avi")
            AVSettingsInfoRow(systemImage: "calendar", title: "Daily word", detail: "Server-selected only")
            AVSettingsButton(
                title: "Reset local game rotation",
                style: .destructive,
                action: { resetConfirmationIsPresented = true }
            )
            if didResetLocalData {
                AVSettingsStatusCard(
                    systemImage: "checkmark.circle",
                    title: "Local rotation reset",
                    detail: "The next local game will start a fresh target deck."
                )
            }
        }
    }

    private var helpCard: some View {
        AVSettingsSectionCard(
            title: "Privacy, help & legal",
            subtitle: "Public DuelWords AV information opens through secure HTTPS pages."
        ) {
            AVSettingsActionRow(systemImage: "shippingbox", title: "Open-source notices", detail: "Licenses for bundled dictionaries and software.", action: { action("openNotices", nil) })
            AVSettingsActionRow(systemImage: "chevron.left.forwardslash.chevron.right", title: "Source code", detail: "Open the public DuelWords AV repository.", action: { action("openSource", nil) })
            AVSettingsActionRow(systemImage: "questionmark.circle", title: "Support", detail: "Open DuelWords AV support.", action: { action("openSupport", nil) })
            AVSettingsActionRow(systemImage: "hand.raised", title: "Privacy policy", detail: "How DuelWords AV handles product and account data.", action: { action("openPrivacy", nil) })
            AVSettingsActionRow(systemImage: "doc.text", title: "Terms of use", detail: "Terms that apply to DuelWords AV.", action: { action("openTerms", nil) })
            AVSettingsDestructiveActionCard(
                sectionTitle: "Account safety",
                systemImage: "person.crop.circle.badge.minus",
                title: "Delete Apps AV account",
                detail: "Review the secure deletion workflow and consequences.",
                action: { action("deleteAccount", nil) }
            )
        }
    }

    private func appearanceOption(_ title: String, value: String, systemImage: String) -> some View {
        AVSettingsOptionButton(title: title, systemImage: systemImage, isSelected: props.appearance == value) {
            action("setAppearance", value)
        }
    }
}

private struct DuelWordsAccountSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        AVSettingsProfileScreenScaffold(
            title: "Account",
            subtitle: props.signedIn ? "Your identity, continuity, and DuelWords access." : "Play locally as a guest. Sign in when account continuity adds value.",
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            showsTopSafeAreaShield: true,
            showsChrome: UIDevice.current.userInterfaceIdiom != .pad
        ) {
            DuelWordsHeaderSurface(props: headerProps, action: action)
        } content: {
            identityCard
            proCard
            continuityCard
            if props.signedIn {
                safetyCard
            }
        }
    }

    private var headerProps: DuelWordsSharedSurfaceProps {
        DuelWordsSharedSurfaceProps(
            surface: "header", selectedTab: "account", interfaceLocale: props.interfaceLocale,
            appearance: props.appearance, accountAvailable: props.accountAvailable, signedIn: props.signedIn,
            displayName: props.displayName, deletionBlockersJSON: props.deletionBlockersJSON,
            deletionBusy: props.deletionBusy, deletionCanFinalize: props.deletionCanFinalize,
            deletionError: props.deletionError, deletionStatus: props.deletionStatus,
            deletionWarningsJSON: props.deletionWarningsJSON, email: props.email, planTier: props.planTier,
            activeProvider: props.activeProvider, authError: props.authError,
            authInitiallyPresented: props.authInitiallyPresented, hapticsEnabled: props.hapticsEnabled
        )
    }

    private var identityCard: some View {
        AVSettingsSectionCard(
            title: props.signedIn ? "Connected account" : "Guest player",
            subtitle: props.signedIn ? (props.email.isEmpty ? "Account AV identity verified." : props.email) : "No account is required for local play."
        ) {
            AVSettingsInfoRow(systemImage: "person.crop.circle", title: "Identity", detail: props.signedIn ? (props.displayName.isEmpty ? "Connected" : props.displayName) : "Guest · local")
            AVSettingsInfoRow(systemImage: "sparkles.rectangle.stack", title: "Plan", detail: props.planTier == "pro" ? "DuelWords Pro" : props.signedIn ? "Free" : "Guest")
            if props.signedIn {
                AVSettingsButton(title: "Sign out", style: .secondary, action: { action("signOut", nil) })
            } else {
                AVSettingsButton(
                    title: props.accountAvailable ? "Connect Account AV" : "Account AV unavailable",
                    style: .primary,
                    action: { action("signIn", nil) }
                )
                .disabled(!props.accountAvailable)
            }
        }
    }

    private var continuityCard: some View {
        AVSettingsSectionCard(title: "Continuity", subtitle: props.signedIn ? "Account AV has verified this identity." : "Practice, Daily, and Play Avi stay on this device while you are a guest.") {
            AVSettingsInfoRow(systemImage: "gamecontroller", title: "Game history", detail: "Stored on this device")
            AVSettingsInfoRow(systemImage: "person.2", title: "Rivals", detail: props.signedIn ? "Account surface prepared" : "Sign-in required")
        }
    }

    private var proCard: some View {
        AVSettingsSectionCard(title: "DuelWords Pro", subtitle: "More history. The same fair game.") {
            AVSettingsInfoRow(systemImage: "checkmark.shield", title: "Fair play", detail: "Pro never adds hints, time, attempts, or different feedback.")
            AVSettingsButton(
                title: proActionTitle,
                style: .primary,
                action: { action(props.signedIn ? "paywall" : "signIn", nil) }
            )
            .disabled(!props.signedIn && !props.accountAvailable)
        }
    }

    private var proActionTitle: String {
        if props.planTier == "pro" { return "View Pro access" }
        if props.signedIn { return "Explore DuelWords Pro" }
        return props.accountAvailable ? "Sign in for DuelWords Pro" : "Account AV unavailable"
    }

    private var safetyCard: some View {
        AVSettingsSectionCard(title: "Account safety", subtitle: "Account deletion follows the guarded Account AV workflow.") {
            AVSettingsDestructiveActionCard(sectionTitle: "Account safety", systemImage: "trash", title: "Delete Apps AV account", detail: "Review deletion before confirming.", action: { action("deleteAccount", nil) })
        }
    }
}

private struct DuelWordsInterfaceLocaleOption: Identifiable {
    let id: String
    let displayName: String
    let autonym: String

    var menuTitle: String { "\(displayName) (\(autonym))" }

    static let all = [
        DuelWordsInterfaceLocaleOption(id: "en", displayName: "English", autonym: "English"),
        DuelWordsInterfaceLocaleOption(id: "es", displayName: "Spanish", autonym: "Español"),
        DuelWordsInterfaceLocaleOption(id: "ca", displayName: "Catalan", autonym: "Català"),
        DuelWordsInterfaceLocaleOption(id: "fr", displayName: "French", autonym: "Français"),
        DuelWordsInterfaceLocaleOption(id: "de", displayName: "German", autonym: "Deutsch")
    ]
}

private struct DuelWordsPaywallSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        AVPaywallSheetScaffold(
            navigationTitle: "DuelWords Pro",
            closeTitle: "Close",
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            onClose: { action("close", nil) }
        ) {
            AVPaywallHeader(
                eyebrow: "DuelWords Pro",
                title: props.planTier == "pro" ? "Pro is active." : "More of your story. None of the unfair stuff.",
                subtitle: "Pro expands private continuity without changing the rules of a duel."
            )
            AVPaywallOfferCard(
                title: props.planTier == "pro" ? "Your access" : props.signedIn ? "Subscriptions are coming later" : "Account AV required",
                detail: props.planTier == "pro" ? "Active Apps AV entitlement." : "Purchases are not offered in this build.",
                primaryButtonTitle: props.planTier == "pro" ? "Done" : props.signedIn ? "Not offered in this build" : "Sign in to continue",
                primaryButtonIsDisabled: props.signedIn && props.planTier != "pro",
                primaryAction: { action(props.planTier == "pro" ? "close" : "signIn", nil) },
                avatar: {
                    Image("AviV2OnboardingCTA").resizable().scaledToFit()
                },
                restoreButton: {
                    AVPaywallRestoreButton(title: "Refresh Apps AV access", action: { action("refreshAccount", nil) })
                }
            )
            AVPaywallBenefitList(items: [
                AVPaywallBenefitItem(id: "ads", systemImage: "rectangle.slash", title: "No ads", detail: "Keep Home and result surfaces quiet."),
                AVPaywallBenefitItem(id: "history", systemImage: "clock.arrow.circlepath", title: "Deeper private history", detail: "Retain more finalized summaries privately."),
                AVPaywallBenefitItem(id: "fair", systemImage: "checkmark.shield", title: "Same fair rules", detail: "No hints, extra time, attempts, or feedback."),
                AVPaywallBenefitItem(id: "account", systemImage: "person.crop.circle.badge.checkmark", title: "Account-backed access", detail: "Apps AV remains the entitlement authority.")
            ])
            AVPaywallFooterActions(actions: [
                AVPaywallFooterAction(title: "Terms", accessibilityIdentifier: "paywall.terms", action: { action("openTerms", nil) }),
                AVPaywallFooterAction(title: "Privacy", accessibilityIdentifier: "paywall.privacy", action: { action("openPrivacy", nil) }),
                AVPaywallFooterAction(title: "Support", accessibilityIdentifier: "paywall.support", action: { action("openSupport", nil) })
            ])
        }
    }
}

private struct DuelWordsDeleteAccountSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction
    @State private var confirmation = ""

    var body: some View {
        AVSettingsSheetScaffold(
            spacing: 18,
            horizontalPadding: 24,
            topPadding: 24,
            bottomPadding: 24,
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            closeTitle: "Done",
            closeAccessibilityIdentifier: "accountDeletion.done",
            onClose: { action("close", nil) }
        ) {
            AVSettingsScreenHeader(
                title: "Delete Apps AV account",
                subtitle: "This deletes the shared identity used by connected Apps AV products—not only DuelWords AV.",
                titleAccessibilityIdentifier: "accountDeletion.title"
            )

            if !props.signedIn {
                AVSettingsStatusCard(
                    systemImage: "person.crop.circle.badge.exclamationmark",
                    title: "Sign in first",
                    detail: "Account deletion is available for the currently authenticated Account AV identity."
                )
                AVSettingsButton(title: "Sign in to Account AV", style: .primary, action: { action("signIn", nil) })
            } else if props.deletionBusy && props.deletionStatus.isEmpty {
                AVSettingsLoadingState("Checking Account AV…")
            } else {
                AVSettingsNoticeCard(
                    systemImage: "person.2.badge.gearshape",
                    title: "Shared Apps AV account",
                    detail: "Remote account data and connected app links are removed. Local-only practice data on this device is separate."
                )
                stateContent
            }
        }
        .accessibilityIdentifier("accountDeletion.sheet")
    }

    @ViewBuilder
    private var stateContent: some View {
        if !props.deletionError.isEmpty {
            AVSettingsStatusCard(
                systemImage: "exclamationmark.triangle",
                title: "Account AV could not continue",
                detail: props.deletionError
            )
            AVSettingsButton(title: "Retry safely", style: .secondary, action: { action("retry", nil) })
        }

        switch props.deletionStatus {
        case "eligible":
            AVSettingsStatusCard(
                systemImage: "checkmark.shield",
                title: "Deletion is available",
                detail: "Review every consequence before making the permanent request."
            )
            deletionItems(warnings, prefix: "warning")
            Text("Type DELETE exactly. This cannot be undone and may not cancel subscriptions billed by Apple, Google, or another provider.")
                .font(.system(size: 14, weight: .semibold))
            AVSettingsTextField("DELETE", text: $confirmation, accessibilityIdentifier: "accountDeletion.confirmation")
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
            AVSettingsButton(
                title: props.deletionBusy ? "Requesting deletion…" : "Delete Apps AV account",
                style: .destructivePrimary,
                isLoading: props.deletionBusy,
                action: confirmDeletion
            )
            .disabled(!canConfirm || props.deletionBusy)
            .opacity(canConfirm ? 1 : 0.45)
        case "blocked":
            AVSettingsStatusCard(
                systemImage: "lock.shield",
                title: "Action needed before deletion",
                detail: "Account AV reports conditions that must be resolved before retrying."
            )
            deletionItems(blockers, prefix: "blocker")
            deletionItems(warnings, prefix: "warning")
            AVSettingsButton(title: "Refresh status", style: .secondary, action: { action("retry", nil) })
        case "inProgress":
            AVSettingsStatusCard(
                systemImage: "clock.badge.exclamationmark",
                title: "Deletion is in progress",
                detail: "The request is already recorded. Refresh its state instead of submitting it again."
            )
            deletionItems(blockers, prefix: "blocker")
            deletionItems(warnings, prefix: "warning")
            AVSettingsButton(title: "Refresh status", style: .secondary, action: { action("retry", nil) })
            if props.deletionCanFinalize {
                AVSettingsButton(
                    title: props.deletionBusy ? "Finishing deletion…" : "Finish deletion",
                    style: .primary,
                    isLoading: props.deletionBusy,
                    action: { action("finalizeDelete", nil) }
                )
                .disabled(props.deletionBusy)
            }
        case "completed":
            AVSettingsStatusCard(
                systemImage: "checkmark.circle",
                title: "Account deleted",
                detail: "The shared Account AV deletion workflow has completed. DuelWords AV will return to guest mode."
            )
            AVSettingsButton(title: "Continue as guest", style: .primary, action: { action("continueGuest", nil) })
        default:
            if props.deletionError.isEmpty {
                AVSettingsStatusCard(
                    systemImage: "safari",
                    title: "Deletion status unavailable",
                    detail: "No account changes were made. Retry or open the public support page."
                )
                AVSettingsButton(title: "Retry safely", style: .secondary, action: { action("retry", nil) })
            }
        }

        AVSettingsButton(title: "Open deletion support", style: .secondary, action: { action("openDeletionSupport", nil) })
    }

    private var canConfirm: Bool {
        confirmation.trimmingCharacters(in: .whitespacesAndNewlines).uppercased() == "DELETE"
    }

    private func confirmDeletion() {
        guard canConfirm else { return }
        action("confirmDelete", confirmation)
    }

    private var blockers: [DuelWordsDeletionItem] {
        DuelWordsDeletionItem.decode(props.deletionBlockersJSON)
    }

    private var warnings: [DuelWordsDeletionItem] {
        DuelWordsDeletionItem.decode(props.deletionWarningsJSON)
    }

    private func deletionItems(_ items: [DuelWordsDeletionItem], prefix: String) -> some View {
        AVSettingsDetailList(items: items.enumerated().map { index, item in
            AVSettingsDetailListItem(
                id: "\(prefix).\(item.type).\(index)",
                title: item.label,
                detail: item.detail,
                linkTitle: item.managementUrl == nil ? nil : "Manage",
                linkDestination: item.managementUrl.flatMap(URL.init(string:)),
                accessibilityIdentifier: "accountDeletion.\(prefix).\(item.type)"
            )
        })
    }
}

private struct DuelWordsDeletionItem: Decodable {
    let type: String
    let label: String
    let detail: String?
    let managementUrl: String?

    static func decode(_ json: String) -> [DuelWordsDeletionItem] {
        guard let data = json.data(using: .utf8) else { return [] }
        return (try? JSONDecoder().decode([DuelWordsDeletionItem].self, from: data)) ?? []
    }
}
