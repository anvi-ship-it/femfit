import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Common "../types/common";
import SubTypes "../types/subscription";

module {
  public type Subscription = SubTypes.Subscription;

  let SEVEN_DAYS_NS : Int = 604_800_000_000_000;

  // Create a free-trial subscription starting now.
  public func startFreeTrial(
    subs   : Map.Map<Principal, Subscription>,
    caller : Principal,
    nowNs  : Int,
  ) : () {
    let sub : Subscription = {
      tier            = #freeTrial;
      status          = #active;
      startDate       = nowNs;
      trialEndsAt     = nowNs + SEVEN_DAYS_NS;
      renewalDate     = null;
      stripeSessionId = null;
    };
    subs.add(caller, sub);
  };

  // Get current subscription; null if user never signed up.
  public func getSubscription(
    subs   : Map.Map<Principal, Subscription>,
    caller : Principal,
  ) : ?Subscription {
    subs.get(caller);
  };

  // Upgrade subscription tier (e.g. after Stripe payment).
  public func upgradeTier(
    subs      : Map.Map<Principal, Subscription>,
    caller    : Principal,
    tier      : Common.SubscriptionTier,
    nowNs     : Int,
    sessionId : Text,
  ) : () {
    let renewalNs = renewalInterval(tier, nowNs);
    let sub : Subscription = {
      tier            = tier;
      status          = #active;
      startDate       = nowNs;
      trialEndsAt     = nowNs; // trial effectively over
      renewalDate     = ?renewalNs;
      stripeSessionId = ?sessionId;
    };
    subs.add(caller, sub);
  };

  // Cancel subscription for a user.
  public func cancelSubscription(
    subs   : Map.Map<Principal, Subscription>,
    caller : Principal,
  ) : () {
    switch (subs.get(caller)) {
      case null { /* nothing to cancel */ };
      case (?sub) {
        subs.add(caller, { sub with status = #cancelled });
      };
    };
  };

  // Number of trial days remaining (0 if expired or not a trial).
  public func trialDaysRemaining(sub : Subscription, nowNs : Int) : Nat {
    if (sub.tier != #freeTrial) { return 0 };
    if (sub.status != #active) { return 0 };
    let remaining = sub.trialEndsAt - nowNs;
    if (remaining <= 0) { return 0 };
    let days = remaining / (24 * 60 * 60 * 1_000_000_000);
    days.toNat();
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  func renewalInterval(tier : Common.SubscriptionTier, nowNs : Int) : Int {
    switch (tier) {
      case (#weekly)  { nowNs + 7  * 24 * 60 * 60 * 1_000_000_000 };
      case (#monthly) { nowNs + 30 * 24 * 60 * 60 * 1_000_000_000 };
      case (#premium) { nowNs + 30 * 24 * 60 * 60 * 1_000_000_000 };
      case (#freeTrial) { nowNs + SEVEN_DAYS_NS };
    };
  };
};
