import AVBrandFoundation
import AVSettingsFoundation
import SwiftUI

enum DuelWordsAppExperience {
    static let identity = AVAppIdentity(
        displayName: "DuelWords AV",
        shortName: "DuelWords",
        assistantName: "Avi",
        accountName: "Account AV"
    )

    static let experience = AVCommonAppExperience(
        identity: identity,
        legalLinks: AVAppLegalLinks(
            supportURL: URL(string: "https://duelwords-av.avalsys.com/support/"),
            privacyURL: URL(string: "https://duelwords-av.avalsys.com/privacy/"),
            termsURL: URL(string: "https://duelwords-av.avalsys.com/terms/"),
            accountDeletionURL: URL(string: "https://duelwords-av.avalsys.com/delete-account/")
        ),
        // Common Apps AV surfaces intentionally use the same canonical palette
        // as Tune AV. Product-specific paper/ink colors belong to the game
        // screens and artwork, not shared chrome, account, settings, or paywall.
        brandPalette: .standard,
        visualAssets: AVCommonAppVisualAssets(
            headerLogoName: "DuelWordsHeaderLogo",
            splashLogoName: "DuelWordsSplashLogo",
            splashHeroName: "DuelWordsSplashHero",
            onboardingBrandName: "DuelWordsOnboardingBrand",
            onboardingHeroName: "DuelWordsOnboardingHero",
            onboardingCTACompanionName: "AviV2OnboardingCTA",
            onboardingAuthPanelCompanionName: "AviV2LoginSheetPeek",
            footerAssistantName: "AviFooterIcon"
        ),
        splashTagline: "A fair word duel, whenever you are ready.",
        splashStatus: "Preparing the board…",
        onboardingTitle: "Challenge a friend. Or play Avi.",
        onboardingSubtitle: "Five letters, six tries, and the same fair rules for everyone.",
        onboardingPrimaryTitle: "Continue",
        onboardingSecondaryTitle: "Skip for now",
        onboardingBackgroundStart: Color(red: 0.97, green: 0.94, blue: 0.86),
        onboardingBackgroundMid: Color(red: 0.99, green: 0.97, blue: 0.91),
        onboardingBackgroundEnd: Color(red: 0.90, green: 0.93, blue: 0.89)
    )
}
