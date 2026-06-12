import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import SubLib "../lib/subscription";
import SubTypes "../types/subscription";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  subscriptions      : Map.Map<Principal, SubTypes.Subscription>,
) {
  /// Get the caller's current subscription (includes trial days remaining).
  public query ({ caller }) func getSubscription() : async ?SubTypes.Subscription {
    SubLib.getSubscription(subscriptions, caller);
  };

  /// Called on first login: auto-starts the 7-day free trial if no subscription exists.
  public shared ({ caller }) func initFreeTrial() : async () {
    switch (SubLib.getSubscription(subscriptions, caller)) {
      case null {
        SubLib.startFreeTrial(subscriptions, caller, Time.now());
      };
      case (?_) { /* already has a subscription */ };
    };
  };

  /// Cancel the caller's subscription.
  public shared ({ caller }) func cancelSubscription() : async () {
    SubLib.cancelSubscription(subscriptions, caller);
  };

  /// Activate a paid tier after Stripe payment completes.
  public shared ({ caller }) func activateSubscription(
    sessionId : Text,
    tier      : Common.SubscriptionTier,
  ) : async () {
    SubLib.upgradeTier(subscriptions, caller, tier, Time.now(), sessionId);
  };

  /// Grant caller a dummy 6-month subscription for testing purposes.
  public shared ({ caller }) func grantDummySubscription() : async SubTypes.Subscription {
    let nowNs   = Time.now();
    let sixMonthNs : Int = 180 * 24 * 60 * 60 * 1_000_000_000;
    let sub : SubTypes.Subscription = {
      tier            = #monthly;
      status          = #active;
      startDate       = nowNs;
      trialEndsAt     = nowNs;
      renewalDate     = ?(nowNs + sixMonthNs);
      stripeSessionId = ?"dummy-test-6month";
    };
    subscriptions.add(caller, sub);
    sub;
  };
};
