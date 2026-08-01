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
        let experience = DuelWordsAppExperience.experience(interfaceLocale: props.interfaceLocale)
        let locale = DuelWordsNativeL10n(interfaceLocale: props.interfaceLocale).locale
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
        .avCommonAppExperience(experience)
        .environment(\.locale, locale)
        .tint(experience.brandPalette.accent)
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
                title: props.localized("Connect your account"),
                subtitle: props.localized("Use your Account AV account to continue across devices."),
                legalConsentText: legalConsentText,
                unavailableMessage: props.authError.isEmpty
                    ? (props.accountAvailable ? nil : props.localized("Local play remains available on this device."))
                    : props.localized(props.authError),
                skipTitle: props.localized("Skip for now"),
                appleTitle: props.localized("Continue with Apple"),
                googleTitle: props.localized("Continue with Google"),
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
        props.localizedCopy.markdown("By continuing, you agree to the [Terms](https://duelwords-av.avalsys.com/terms/) and [Privacy Policy](https://duelwords-av.avalsys.com/privacy/) of DuelWords AV.")
    }
}

private struct DuelWordsHeaderSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        AVAppShellConfiguredBrandHeader(
            activeItem: activeItem,
            settingsAccessibilityLabel: props.localized("Settings"),
            accountAccessibilityLabel: props.localized("Account"),
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
            assistantAccessibilityLabel: DuelWordsAppExperience.identity.assistantName,
            assistantAccessibilityIdentifier: "footer.avi",
            footerConfiguration: .floating,
            onSelectTab: { action("tab", $0) },
            onSelectAssistant: { action("tab", "avi") },
            footerPlayer: { EmptyView() },
            assistantIcon: { _ in
                AVAppShellFooterAssistantAssetIcon(
                    assetName: DuelWordsAppExperience.experience(interfaceLocale: props.interfaceLocale).visualAssets?.footerAssistantName ?? "AviFooterIcon"
                )
            }
        )
    }

    private var tabs: [AVAppShellTab<String>] {
        [
            AVAppShellTab(id: "play", title: props.localized("Home"), systemImage: "house.fill", accessibilityIdentifier: "footer.home"),
            AVAppShellTab(id: "rivals", title: props.localized("Rivals"), systemImage: "person.2.fill", accessibilityIdentifier: "footer.rivals"),
            AVAppShellTab(id: "stats", title: props.localized("Stats"), systemImage: "chart.bar.fill", accessibilityIdentifier: "footer.stats")
        ]
    }
}

private struct DuelWordsSidebarSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Color.clear
                .frame(height: 56)
                .accessibilityHidden(true)

            sidebarButton(props.localized("Home"), systemImage: "house.fill", route: "play")
            sidebarButton(props.localized("Rivals"), systemImage: "person.2.fill", route: "rivals")
            sidebarButton(props.localized("Stats"), systemImage: "chart.bar.fill", route: "stats")
            sidebarButton("Avi", systemImage: "sparkles", route: "avi")

            Spacer(minLength: 16)

            sidebarButton(props.localized("Settings"), systemImage: "gearshape.fill", route: "settings", fontSize: 15)
            sidebarButton(props.localized("Account"), systemImage: "person.crop.circle.fill", route: "account", fontSize: 15)
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
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.avBrandPalette) private var brandPalette
    @State private var didResetLocalData = false
    @State private var playerDisplayName = ""
    @State private var resetConfirmationIsPresented = false

    var body: some View {
        AVSettingsProfileScreenScaffold(
            title: props.localized("Settings"),
            subtitle: props.localized("Preferences on this device, help, and legal information."),
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            showsTopSafeAreaShield: true,
            showsChrome: !isTabletLayout
        ) {
            DuelWordsHeaderSurface(props: props, action: action)
        } content: {
            appPreferencesCard
            gamePreferencesCard
            onDeviceCard
            helpCard
        }
        .confirmationDialog(
            props.localized("Reset local game data?"),
            isPresented: $resetConfirmationIsPresented,
            titleVisibility: .visible
        ) {
            Button(props.localized("Reset local game rotation"), role: .destructive) {
                action("resetLocalData", nil)
                didResetLocalData = true
            }
            Button(props.localized("Cancel"), role: .cancel) {}
        } message: {
            Text(props.localized("This starts fresh local target decks. Your interface preferences and Account AV identity are not changed."))
        }
    }

    private var isTabletLayout: Bool {
        UIDevice.current.userInterfaceIdiom == .pad && horizontalSizeClass == .regular
    }

    private var appPreferencesCard: some View {
        AVSettingsSectionCard(
            title: props.localized("App preferences"),
            subtitle: props.localized("Choose how DuelWords AV appears on this device.")
        ) {
            AVSettingsInfoRow(
                systemImage: "globe",
                title: props.localized("App language"),
                detail: props.localized("Choose the language used by navigation, help, account, and game messages.")
            )

            interfaceLanguageSelector

            AVSettingsInfoRow(
                systemImage: "circle.lefthalf.filled",
                title: props.localized("Appearance"),
                detail: props.localized("Choose whether DuelWords AV follows the system or always uses a fixed appearance.")
            )

            HStack(spacing: 10) {
                appearanceOption(props.localized("System"), value: "system", systemImage: "circle.lefthalf.filled")
                appearanceOption(props.localized("Light"), value: "light", systemImage: "sun.max.fill")
                appearanceOption(props.localized("Dark"), value: "dark", systemImage: "moon.fill")
            }

            AVSettingsToggleRow(
                systemImage: "iphone.radiowaves.left.and.right",
                title: props.localized("Haptics"),
                detail: props.localized("Short feedback for selections and accepted local actions."),
                isOn: Binding(
                    get: { props.hapticsEnabled },
                    set: { action("setHaptics", $0 ? "true" : "false") }
                )
            )
        }
    }

    private var interfaceLanguageSelector: some View {
        Menu {
            ForEach(DuelWordsInterfaceLocaleOption.all(copy: props.localizedCopy)) { locale in
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
        let locales = DuelWordsInterfaceLocaleOption.all(copy: props.localizedCopy)
        return locales.first(where: { $0.id == props.interfaceLocale }) ?? locales[0]
    }

    private var onDeviceCard: some View {
        AVSettingsSectionCard(
            title: props.localized("On this device"),
            subtitle: props.localized("Local play remains separate from your shared Account AV identity.")
        ) {
            AVSettingsInfoRow(systemImage: "app.badge", title: props.localized("Version"), detail: appVersionDisplay)
            AVSettingsInfoRow(systemImage: "text.book.closed", title: props.localized("Word lists"), detail: props.localized("Bundled EN, ES, CA, FR, and DE"))
            AVSettingsInfoRow(systemImage: "arrow.triangle.2.circlepath", title: props.localized("Offline games"), detail: props.localized("Practice, Solo, and Play Avi rotate through fresh words"))
            AVSettingsInfoRow(systemImage: "calendar", title: props.localized("Daily word"), detail: props.localized("One official word for everyone"))
            AVSettingsButton(
                title: props.localized("Reset local game rotation"),
                style: .destructive,
                action: { resetConfirmationIsPresented = true }
            )
            if didResetLocalData {
                AVSettingsStatusCard(
                    systemImage: "checkmark.circle",
                    title: props.localized("Local rotation reset"),
                    detail: props.localized("The next local game will start a fresh target deck.")
                )
            }
        }
    }

    private var gamePreferencesCard: some View {
        AVSettingsSectionCard(
            title: props.localized("Game preferences"),
            subtitle: props.localized("Defaults for new practice, Avi, and human games. You can change them before each game.")
        ) {
            AVSettingsInfoRow(
                systemImage: "character.book.closed",
                title: props.localized("Game language"),
                detail: props.localized("Default language for new DuelWords games.")
            )
            gameLanguageSelector

            AVSettingsInfoRow(
                systemImage: "brain.head.profile",
                title: props.localized("Avi difficulty"),
                detail: props.localized("Friendly remembers fewer clues and cannot solve before the fourth attempt.")
            )
            HStack(spacing: 10) {
                aviDifficultyOption(props.localized("Friendly"), value: "friendly")
                aviDifficultyOption(props.localized("Balanced"), value: "balanced")
                aviDifficultyOption(props.localized("Expert"), value: "expert")
            }

            AVSettingsInfoRow(
                systemImage: "person.text.rectangle",
                title: props.localized("DuelWords player name"),
                detail: props.localized("Used for human challenges from this device. It does not change your Account AV profile.")
            )
            TextField(
                props.localized("Optional"),
                text: $playerDisplayName
            )
            .textFieldStyle(.roundedBorder)
            .textInputAutocapitalization(.words)
            .autocorrectionDisabled()
            .accessibilityIdentifier("settings.playerDisplayName")
            .onAppear { playerDisplayName = props.playerDisplayName }
            .onChange(of: playerDisplayName) { _, value in
                let limited = String(value.prefix(32))
                if limited != value {
                    playerDisplayName = limited
                } else {
                    action("setPlayerDisplayName", value)
                }
            }
        }
    }

    private var gameLanguageSelector: some View {
        Menu {
            ForEach(DuelWordsGameLanguageOption.all(copy: props.localizedCopy)) { language in
                Button {
                    action("setGameLanguage", language.id)
                } label: {
                    if props.gameLanguage == language.id {
                        Label(language.menuTitle, systemImage: "checkmark")
                    } else {
                        Text(language.menuTitle)
                    }
                }
            }
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(selectedGameLanguage.displayName)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(AVBrandColor.textPrimary)
                    Text(selectedGameLanguage.autonym)
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
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(brandPalette.accent.opacity(0.07)))
            .overlay { RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(brandPalette.accent.opacity(0.18), lineWidth: 1) }
        }
    }

    private var selectedGameLanguage: DuelWordsGameLanguageOption {
        let languages = DuelWordsGameLanguageOption.all(copy: props.localizedCopy)
        return languages.first(where: { $0.id == props.gameLanguage }) ?? languages[0]
    }

    private func aviDifficultyOption(_ title: String, value: String) -> some View {
        AVSettingsOptionButton(title: title, systemImage: value == "friendly" ? "heart.fill" : value == "balanced" ? "scale.3d" : "bolt.fill", isSelected: props.aviDifficulty == value) {
            action("setAviDifficulty", value)
        }
    }

    private var appVersionDisplay: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String
        let resolvedVersion = version.flatMap { $0.isEmpty ? nil : $0 } ?? "—"

        guard let build, !build.isEmpty else {
            return resolvedVersion
        }
        return "\(resolvedVersion) (\(build))"
    }

    private var helpCard: some View {
        AVSettingsSectionCard(
            title: props.localized("Privacy, help & legal"),
            subtitle: props.localized("Find support, privacy, terms, and notices below.")
        ) {
            AVSettingsActionRow(systemImage: "shippingbox", title: props.localized("Open-source notices"), detail: props.localized("Licenses for bundled dictionaries and software."), action: { action("openNotices", nil) })
            AVSettingsActionRow(systemImage: "chevron.left.forwardslash.chevron.right", title: props.localized("Source code"), detail: props.localized("Open the public DuelWords AV repository."), action: { action("openSource", nil) })
            AVSettingsActionRow(systemImage: "questionmark.circle", title: props.localized("Support"), detail: props.localized("Open DuelWords AV support."), action: { action("openSupport", nil) })
            AVSettingsActionRow(systemImage: "hand.raised", title: props.localized("Privacy policy"), detail: props.localized("How DuelWords AV handles product and account data."), action: { action("openPrivacy", nil) })
            AVSettingsActionRow(systemImage: "doc.text", title: props.localized("Terms of use"), detail: props.localized("Terms that apply to DuelWords AV."), action: { action("openTerms", nil) })
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
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        AVSettingsProfileScreenScaffold(
            title: props.localized("Account"),
            subtitle: props.signedIn ? props.localized("Your account and DuelWords access in one place.") : props.localized("Play locally as a guest. Sign in when you want access across devices."),
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            showsTopSafeAreaShield: true,
            showsChrome: !isTabletLayout
        ) {
            DuelWordsHeaderSurface(props: props, action: action)
        } content: {
            identityCard
            proCard
            continuityCard
            if props.signedIn {
                safetyCard
            }
        }
    }

    private var isTabletLayout: Bool {
        UIDevice.current.userInterfaceIdiom == .pad && horizontalSizeClass == .regular
    }

    private var identityCard: some View {
        AVSettingsSectionCard(
            title: props.signedIn ? props.localized("Connected account") : props.localized("Guest player"),
            subtitle: props.signedIn ? (props.email.isEmpty ? props.localized("Signed in with Account AV.") : props.email) : props.localized("No account is required for local play.")
        ) {
            AVSettingsInfoRow(systemImage: "person.crop.circle", title: props.localized("Identity"), detail: props.signedIn ? (props.displayName.isEmpty ? props.localized("Connected") : props.displayName) : props.localized("Guest · local"))
            AVSettingsInfoRow(systemImage: "sparkles.rectangle.stack", title: props.localized("Plan"), detail: props.planTier == "pro" ? "DuelWords Pro" : props.signedIn ? props.localized("Free") : props.localized("Guest"))
            if props.signedIn {
                AVSettingsButton(title: props.localized("Sign out"), style: .secondary, action: { action("signOut", nil) })
            } else {
                AVSettingsButton(
                    title: props.accountAvailable ? props.localized("Connect Account AV") : props.localized("Account AV unavailable"),
                    style: .primary,
                    action: { action("signIn", nil) }
                )
                .disabled(!props.accountAvailable)
            }
        }
    }

    private var continuityCard: some View {
        AVSettingsSectionCard(title: props.localized("Across your devices"), subtitle: props.signedIn ? props.localized("You are signed in with Account AV.") : props.localized("Practice, Daily, and Play Avi stay on this device while you are a guest.")) {
            AVSettingsInfoRow(systemImage: "gamecontroller", title: props.localized("Game history"), detail: props.localized("Stored on this device"))
            AVSettingsInfoRow(systemImage: "person.2", title: props.localized("Rivals"), detail: props.localized("Stored on this device"))
        }
    }

    private var proCard: some View {
        AVSettingsSectionCard(title: "DuelWords Pro", subtitle: props.localized("More history. The same fair game.")) {
            AVSettingsInfoRow(systemImage: "checkmark.shield", title: props.localized("Fair play"), detail: props.localized("Pro never adds hints, time, attempts, or different feedback."))
            AVSettingsButton(
                title: proActionTitle,
                style: .primary,
                action: { action(props.signedIn ? "paywall" : "signIn", nil) }
            )
            .disabled(!props.signedIn && !props.accountAvailable)
        }
    }

    private var proActionTitle: String {
        if props.planTier == "pro" { return props.localized("View Pro access") }
        if props.signedIn { return props.localized("Explore DuelWords Pro") }
        return props.accountAvailable ? props.localized("Sign in for DuelWords Pro") : props.localized("Account AV unavailable")
    }

    private var safetyCard: some View {
        AVSettingsSectionCard(title: props.localized("Account safety"), subtitle: props.localized("Account deletion follows the guarded Account AV workflow.")) {
            AVSettingsDestructiveActionCard(sectionTitle: props.localized("Account safety"), systemImage: "trash", title: props.localized("Delete Apps AV account"), detail: props.localized("Review deletion before confirming."), action: { action("deleteAccount", nil) })
        }
    }
}

private struct DuelWordsInterfaceLocaleOption: Identifiable {
    let id: String
    let displayName: String
    let autonym: String

    var menuTitle: String { "\(displayName) (\(autonym))" }

    static func all(copy: DuelWordsNativeL10n) -> [DuelWordsInterfaceLocaleOption] {
        [
            DuelWordsInterfaceLocaleOption(id: "en", displayName: copy.text("English"), autonym: "English"),
            DuelWordsInterfaceLocaleOption(id: "es", displayName: copy.text("Spanish"), autonym: "Español"),
            DuelWordsInterfaceLocaleOption(id: "ca", displayName: copy.text("Catalan"), autonym: "Català"),
            DuelWordsInterfaceLocaleOption(id: "fr", displayName: copy.text("French"), autonym: "Français"),
            DuelWordsInterfaceLocaleOption(id: "de", displayName: copy.text("German"), autonym: "Deutsch")
        ]
    }
}

private struct DuelWordsGameLanguageOption: Identifiable {
    let id: String
    let displayName: String
    let autonym: String

    var menuTitle: String { "\(displayName) (\(autonym))" }

    static func all(copy: DuelWordsNativeL10n) -> [DuelWordsGameLanguageOption] {
        [
            DuelWordsGameLanguageOption(id: "en", displayName: copy.text("English"), autonym: "English"),
            DuelWordsGameLanguageOption(id: "es", displayName: copy.text("Spanish"), autonym: "Español"),
            DuelWordsGameLanguageOption(id: "ca", displayName: copy.text("Catalan"), autonym: "Català"),
            DuelWordsGameLanguageOption(id: "fr", displayName: copy.text("French"), autonym: "Français"),
            DuelWordsGameLanguageOption(id: "de", displayName: copy.text("German"), autonym: "Deutsch")
        ]
    }
}

private struct DuelWordsPaywallSurface: View {
    let props: DuelWordsSharedSurfaceProps
    let action: DuelWordsSharedAction

    @State private var isShowingRedeemCodeSheet = false
    @State private var redeemCode = ""
    @State private var isRedeemingCode = false

    var body: some View {
        AVPaywallSheetScaffold(
            navigationTitle: "Pro",
            closeTitle: props.localized("Close"),
            backgroundStyle: AnyShapeStyle(AVBrandSurface.shellBackground),
            onClose: { action("close", nil) }
        ) {
            AVPaywallHeader(
                eyebrow: "DuelWords Pro",
                title: props.planTier == "pro" ? props.localized("Pro is active.") : props.localized("More of your story. None of the unfair stuff."),
                subtitle: props.localized("Pro keeps more private history without changing the rules of a duel.")
            )
            AVPaywallOfferCard(
                title: "DuelWords Pro",
                detail: props.planTier == "pro"
                    ? props.localized("DuelWords Pro is active on this account.")
                    : props.localized("More Daily games, more history, and more challenges with the same fair rules."),
                primaryButtonTitle: primaryButtonTitle,
                primaryButtonIsDisabled: primaryButtonIsDisabled,
                primaryAccessibilityIdentifier: "paywall.purchase",
                primaryAction: primaryAction,
                avatar: {
                    AVAviAvatarBadge(
                        imageSize: 54,
                        badgeSize: 68,
                        padding: 7,
                        backgroundStyle: .accentSoft,
                        strokeStyle: .accentSoft
                    ) {
                        Image("AviV2OnboardingCTA")
                            .resizable()
                            .scaledToFit()
                    }
                },
                restoreButton: {
                    if props.signedIn && props.planTier != "pro" {
                        AVPaywallRestoreButton(
                            title: props.localized("Restore purchases"),
                            isDisabled: props.subscriptionBusy,
                            action: { action("restorePurchases", nil) }
                        )
                    } else if props.planTier == "pro" {
                        AVPaywallRestoreButton(
                            title: props.localized("Manage Apple subscription"),
                            action: { action("manageSubscriptions", nil) }
                        )
                    }
                }
            )

            subscriptionTermsRow

            if props.subscriptionState == "pending_reconciliation" {
                AVPaywallStatusRow(systemImage: "clock.arrow.circlepath", message: props.localized("Purchase received. Confirming Pro access with Apps AV…"))
            } else if props.subscriptionState == "reconciliation_delayed", !props.subscriptionError.isEmpty {
                AVPaywallStatusRow(systemImage: "clock.badge.exclamationmark", message: props.localized(props.subscriptionError))
            } else if !props.subscriptionError.isEmpty {
                AVPaywallStatusRow(systemImage: "exclamationmark.triangle", message: props.localized(props.subscriptionError))
            }

            AVPaywallBenefitList(items: [
                AVPaywallBenefitItem(id: "daily", systemImage: "calendar", title: props.localized("Daily in every language"), detail: props.localized("Play once per language each day.")),
                AVPaywallBenefitItem(id: "history", systemImage: "clock.arrow.circlepath", title: props.localized("1,000 history records"), detail: props.localized("Keep a 365-day private statistics window on this device.")),
                AVPaywallBenefitItem(id: "challenges", systemImage: "person.2", title: props.localized("100 challenges per day"), detail: props.localized("Create more human challenges without changing duel rules.")),
                AVPaywallBenefitItem(id: "fair", systemImage: "checkmark.shield", title: props.localized("Same fair rules"), detail: props.localized("No hints, extra time, attempts, or feedback."))
            ])
            AVPaywallFooterActions(actions: [
                AVPaywallFooterAction(title: props.localized("Redeem code"), accessibilityIdentifier: "paywall.redeemCode", action: showRedeemCodeSheet),
                AVPaywallFooterAction(title: props.localized("Terms"), accessibilityIdentifier: "paywall.terms", action: { action("openTerms", nil) }),
                AVPaywallFooterAction(title: props.localized("Privacy"), accessibilityIdentifier: "paywall.privacy", action: { action("openPrivacy", nil) })
            ])
        }
        .sheet(isPresented: $isShowingRedeemCodeSheet) {
            redeemCodeSheet
        }
        .onChange(of: props.subscriptionBusy) { _, isBusy in
            if !isBusy { isRedeemingCode = false }
        }
        .onChange(of: props.subscriptionState) { _, state in
            if state == "pending_reconciliation" {
                redeemCode = ""
                isShowingRedeemCodeSheet = false
                isRedeemingCode = false
            }
        }
    }

    @ViewBuilder
    private var subscriptionTermsRow: some View {
        if props.signedIn, props.planTier != "pro", !props.subscriptionPrice.isEmpty {
            AVPaywallStatusRow(
                systemImage: "calendar.badge.clock",
                message: props.localized("DuelWords Pro is a monthly auto-renewable subscription. You will be charged %@ for each 1-month period until you cancel in App Store settings.")
                    .replacingOccurrences(of: "%@", with: props.subscriptionPrice)
            )
            .accessibilityIdentifier("paywall.subscriptionTerms")
        }
    }

    private var redeemCodeSheet: some View {
        NavigationStack {
            ScrollView {
                redeemCodeContent
                    .padding(20)
            }
            .background(AVBrandSurface.shellBackground.ignoresSafeArea())
            .navigationTitle(props.localized("Redeem a code?"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(props.localized("Done")) {
                        isShowingRedeemCodeSheet = false
                    }
                    .accessibilityIdentifier("paywall.redeemCode.done")
                }
            }
        }
        .presentationDetents([.medium])
        .accessibilityIdentifier("paywall.redeemCode.sheet")
    }

    private var redeemCodeContent: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text(props.localized("Redeem a code?"))
                    .font(.headline)
                    .foregroundStyle(AVBrandColor.textPrimary)
                Text(props.localized("Enter a DuelWords AV promo code if one was provided to you."))
                    .font(.subheadline)
                    .foregroundStyle(AVBrandColor.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            HStack(spacing: 10) {
                Image(systemName: "gift.fill")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AVBrandColor.accent)

                TextField(props.localized("Code"), text: $redeemCode)
                    .keyboardType(.asciiCapable)
                    .textContentType(.oneTimeCode)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .onChange(of: redeemCode) { _, newValue in
                        let sanitized = sanitizedRedeemCodeInput(newValue)
                        if sanitized != newValue { redeemCode = sanitized }
                    }
                    .font(.body.weight(.semibold))
                    .padding(.horizontal, 12)
                    .frame(height: 46)
                    .background(AVBrandColor.cardSurface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .accessibilityIdentifier("paywall.redeemCode.field")

                Button(action: claimRedeemCode) {
                    ZStack {
                        if isRedeemingCode || props.subscriptionBusy {
                            ProgressView().tint(AVBrandColor.textInverse)
                        } else {
                            Image(systemName: "arrow.right")
                                .font(.system(size: 17, weight: .black))
                                .foregroundStyle(AVBrandColor.textInverse)
                        }
                    }
                    .frame(width: 46, height: 46)
                    .background(
                        redeemButtonIsDisabled ? AVBrandColor.neutral300 : AVBrandColor.accent,
                        in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                    )
                }
                .disabled(redeemButtonIsDisabled)
                .accessibilityLabel(props.localized("Claim code"))
                .accessibilityIdentifier("paywall.redeemCode.claim")
            }

            Text(props.localized("Codes are optional and are not required to subscribe to Pro."))
                .font(.caption.weight(.semibold))
                .foregroundStyle(AVBrandColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            if !props.subscriptionError.isEmpty {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Image(systemName: "info.circle.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(AVBrandColor.textSecondary)
                    Text(props.localized(props.subscriptionError))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AVBrandColor.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .accessibilityIdentifier("paywall.redeemCode.status")
            }
        }
        .padding(16)
        .background(AVBrandColor.mutedSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var normalizedRedeemCode: String {
        redeemCode.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var redeemButtonIsDisabled: Bool {
        normalizedRedeemCode.isEmpty || isRedeemingCode || props.subscriptionBusy
    }

    private func showRedeemCodeSheet() {
        guard !props.subscriptionBusy else { return }
        if props.signedIn {
            action("prepareRedeemCode", nil)
            isShowingRedeemCodeSheet = true
        } else {
            action("signIn", nil)
        }
    }

    private func claimRedeemCode() {
        let code = normalizedRedeemCode
        guard !code.isEmpty, !redeemButtonIsDisabled else { return }
        isRedeemingCode = true
        action("redeemCode", code)
    }

    private func sanitizedRedeemCodeInput(_ code: String) -> String {
        var sanitized = ""
        for character in code {
            switch character {
            case " ", "\n", "\t":
                continue
            case "\u{2010}", "\u{2011}", "\u{2012}", "\u{2013}", "\u{2014}", "\u{2015}", "\u{2212}", "\u{2018}", "\u{2019}":
                sanitized.append("-")
            case _ where isASCIIAlphanumeric(character) || character == "-" || character == "_":
                sanitized.append(character)
            default:
                continue
            }
        }
        return sanitized.uppercased()
    }

    private func isASCIIAlphanumeric(_ character: Character) -> Bool {
        guard character.unicodeScalars.count == 1,
              let value = character.unicodeScalars.first?.value else { return false }
        return (48...57).contains(value) || (65...90).contains(value) || (97...122).contains(value)
    }

    private var primaryButtonTitle: String {
        if props.planTier == "pro" { return props.localized("Done") }
        if !props.signedIn { return props.localized("Sign in to continue") }
        if props.subscriptionBusy { return props.localized("Please wait…") }
        if props.subscriptionState == "reconciliation_delayed" {
            return props.localized("Pro confirmation pending")
        }
        if props.subscriptionState == "ready", !props.subscriptionPrice.isEmpty {
            return "\(props.localized("Subscribe")) · \(props.subscriptionPrice)"
        }
        return props.localized("Subscription unavailable")
    }

    private var primaryButtonIsDisabled: Bool {
        if !props.signedIn { return !props.accountAvailable }
        return props.planTier != "pro" && (props.subscriptionState != "ready" || props.subscriptionBusy)
    }

    private func primaryAction() {
        if props.planTier == "pro" { action("close", nil) }
        else if props.signedIn { action("purchasePro", nil) }
        else { action("signIn", nil) }
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
            closeTitle: props.localized("Back"),
            closeSystemImage: "chevron.left",
            closeAccessibilityIdentifier: "accountDeletion.back",
            onClose: { action("close", nil) }
        ) {
            AVSettingsScreenHeader(
                title: props.localized("Delete Apps AV account"),
                subtitle: props.localized("This deletes the shared identity used by connected Apps AV products—not only DuelWords AV."),
                titleAccessibilityIdentifier: "accountDeletion.title"
            )

            if !props.signedIn {
                AVSettingsStatusCard(
                    systemImage: "person.crop.circle.badge.exclamationmark",
                    title: props.localized("Sign in first"),
                    detail: props.localized("You can review and delete the Account AV account currently signed in.")
                )
                AVSettingsButton(title: props.localized("Sign in to Account AV"), style: .primary, action: { action("signIn", nil) })
            } else if props.deletionBusy && props.deletionStatus.isEmpty {
                AVSettingsLoadingState(props.localized("Checking Account AV…"))
            } else {
                AVSettingsNoticeCard(
                    systemImage: "person.2.badge.gearshape",
                    title: props.localized("Shared Apps AV account"),
                    detail: props.localized("Your shared Account AV data and connected app links are removed. Local practice data on this device is separate.")
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
                title: props.localized("Account AV could not continue"),
                detail: props.localized(props.deletionError)
            )
            AVSettingsButton(title: props.localized("Retry safely"), style: .secondary, action: { action("retry", nil) })
        }

        switch props.deletionStatus {
        case "eligible":
            AVSettingsStatusCard(
                systemImage: "checkmark.shield",
                title: props.localized("Deletion is available"),
                detail: props.localized("Review every consequence before making the permanent request.")
            )
            deletionItems(warnings, prefix: "warning")
            Text(props.localized("Type DELETE exactly. This cannot be undone and may not cancel subscriptions billed by Apple, Google, or another provider."))
                .font(.system(size: 14, weight: .semibold))
            AVSettingsTextField("DELETE", text: $confirmation, accessibilityIdentifier: "accountDeletion.confirmation")
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
            AVSettingsButton(
                title: props.deletionBusy ? props.localized("Requesting deletion…") : props.localized("Delete Apps AV account"),
                style: .destructivePrimary,
                isLoading: props.deletionBusy,
                action: confirmDeletion
            )
            .disabled(!canConfirm || props.deletionBusy)
            .opacity(canConfirm ? 1 : 0.45)
        case "blocked":
            AVSettingsStatusCard(
                systemImage: "lock.shield",
                title: props.localized("Action needed before deletion"),
                detail: props.localized("Some items need your attention before deletion can continue.")
            )
            deletionItems(blockers, prefix: "blocker")
            deletionItems(warnings, prefix: "warning")
            AVSettingsButton(title: props.localized("Refresh status"), style: .secondary, action: { action("retry", nil) })
        case "inProgress":
            AVSettingsStatusCard(
                systemImage: "clock.badge.exclamationmark",
                title: props.localized("Deletion is in progress"),
                detail: props.localized("Your request is already in progress. Check again instead of submitting it twice.")
            )
            deletionItems(blockers, prefix: "blocker")
            deletionItems(warnings, prefix: "warning")
            AVSettingsButton(title: props.localized("Refresh status"), style: .secondary, action: { action("retry", nil) })
            if props.deletionCanFinalize {
                AVSettingsButton(
                    title: props.deletionBusy ? props.localized("Finishing deletion…") : props.localized("Finish deletion"),
                    style: .primary,
                    isLoading: props.deletionBusy,
                    action: { action("finalizeDelete", nil) }
                )
                .disabled(props.deletionBusy)
            }
        case "completed":
            AVSettingsStatusCard(
                systemImage: "checkmark.circle",
                title: props.localized("Account deleted"),
                detail: props.localized("The shared Account AV deletion workflow has completed. DuelWords AV will return to guest mode.")
            )
            AVSettingsButton(title: props.localized("Continue as guest"), style: .primary, action: { action("continueGuest", nil) })
        default:
            if props.deletionError.isEmpty {
                AVSettingsStatusCard(
                    systemImage: "safari",
                    title: props.localized("Deletion status unavailable"),
                    detail: props.localized("No account changes were made. Retry or open the public support page.")
                )
                AVSettingsButton(title: props.localized("Retry safely"), style: .secondary, action: { action("retry", nil) })
            }
        }

        AVSettingsButton(title: props.localized("Open deletion support"), style: .secondary, action: { action("openDeletionSupport", nil) })
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
                title: props.localized(item.label),
                detail: item.detail.map { props.localized($0) },
                linkTitle: item.managementUrl == nil ? nil : props.localized("Manage"),
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

private extension DuelWordsSharedSurfaceProps {
    var localizedCopy: DuelWordsNativeL10n {
        DuelWordsNativeL10n(interfaceLocale: interfaceLocale)
    }

    func localized(_ english: String) -> String {
        localizedCopy.text(english)
    }
}
