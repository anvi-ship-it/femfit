import Common "common";

module {
  public type Subscription = {
    tier          : Common.SubscriptionTier;
    status        : Common.SubscriptionStatus;
    startDate     : Common.Timestamp;
    trialEndsAt   : Common.Timestamp;
    renewalDate   : ?Common.Timestamp;
    stripeSessionId : ?Text;
  };
};
