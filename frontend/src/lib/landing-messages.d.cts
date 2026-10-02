export type LandingLocale = 'th' | 'en';
export type LandingCopy = {
  menuNews:string; loginToConsole:string; openMenu:string; heroConnect:string; heroCta:string; slideLabel:string; serviceBookingBody:string; serviceMembershipBody:string; serviceCheckinBody:string; newsTermsBody:string; newsStatsBody:string; newsCourtCategory:string; newsDashboardCategory:string;
  guideTitle:string; guideIntro:string; guideStep1Title:string; guideStep1Body:string; guideStep2Title:string; guideStep2Body:string; guideStep3Title:string; guideStep3Body:string; guideStep4Title:string; guideStep4Body:string;
  tipsTitle:string; tipsIntro:string; tipsViewAll:string; tipsWarmTitle:string; tipsWarmBody:string; tipsWarmCategory:string; tipsStringTitle:string; tipsStringBody:string; tipsStringCategory:string;
  rulesTitle:string; rulesIntro:string; rulesBookingTitle:string; rulesBookingLimit:string; rulesAdvance:string; rulesAccessTitle:string; rulesIdentity:string; rulesLate:string; rulesCancelTitle:string; rulesCancellation:string; rulesPenalty:string; rulesCourtTitle:string; rulesFootwear:string;
  footerDescription:string; footerRules:string; footerBooking:string; footerCancellation:string; footerEtiquette:string; footerFees:string; footerContact:string; footerSupport:string; footerIssue:string; footerTerms:string; footerTrademarks:string;
};
export const landingMessages: Record<LandingLocale, LandingCopy>;
