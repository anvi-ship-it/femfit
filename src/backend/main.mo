import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import ProfileTypes "types/profile";
import PlanTypes "types/plans";
import SubTypes "types/subscription";
import Common "types/common";
import ProfileMixin "mixins/profile-api";
import CycleMixin "mixins/cycle-api";
import PlansMixin "mixins/plans-api";
import SubscriptionMixin "mixins/subscription-api";





actor {
  // ── Authorization ─────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── State ─────────────────────────────────────────────────────────────────
  let profiles      = Map.empty<Principal, ProfileTypes.OnboardingProfile>();
  let dailyLogs     = Map.empty<Text, PlanTypes.DailyLog>();
  let subscriptions = Map.empty<Principal, SubTypes.Subscription>();

  // ── Mixins ────────────────────────────────────────────────────────────────
  include ProfileMixin(accessControlState, profiles);
  include CycleMixin(accessControlState, profiles);
  include PlansMixin(accessControlState, profiles, dailyLogs);
  include SubscriptionMixin(accessControlState, subscriptions);

  // ── Stripe (required by extension: functions must be in actor) ─────────────
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  func getConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe is not configured") };
      case (?c) { c };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getConfig(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  /// Create a Stripe checkout session for a specific subscription tier.
  public shared ({ caller }) func createSubscriptionCheckout(
    tier       : Common.SubscriptionTier,
    successUrl : Text,
    cancelUrl  : Text,
  ) : async Text {
    let item = tierToShoppingItem(tier);
    await Stripe.createCheckoutSession(getConfig(), caller, [item], successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── Private helpers ───────────────────────────────────────────────────────

  func tierToShoppingItem(tier : Common.SubscriptionTier) : Stripe.ShoppingItem {
    switch (tier) {
      case (#weekly) {
        {
          currency           = "inr";
          productName        = "3-Month Plan";
          productDescription = "Full access for 3 months";
          priceInCents       = 149900;
          quantity           = 1;
        };
      };
      case (#monthly) {
        {
          currency           = "inr";
          productName        = "6-Month Plan";
          productDescription = "Full access for 6 months";
          priceInCents       = 249900;
          quantity           = 1;
        };
      };
      case (#premium) {
        {
          currency           = "inr";
          productName        = "12-Month Plan";
          productDescription = "Full access for 12 months";
          priceInCents       = 399900;
          quantity           = 1;
        };
      };
      case (#freeTrial) {
        {
          currency           = "inr";
          productName        = "Free Trial";
          productDescription = "7-day free trial — no charge";
          priceInCents       = 0;
          quantity           = 1;
        };
      };
    };
  };
};
