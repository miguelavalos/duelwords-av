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
        brandPalette: AVBrandPalette(
            ink: Color(red: 24 / 255, green: 50 / 255, blue: 71 / 255),
            accent: Color(red: 41 / 255, green: 106 / 255, blue: 112 / 255),
            canvas: Color(red: 244 / 255, green: 235 / 255, blue: 216 / 255),
            launchSurfaceStart: Color(red: 0.97, green: 0.94, blue: 0.86),
            launchSurfaceMid: Color(red: 0.99, green: 0.97, blue: 0.91)
        ),
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
