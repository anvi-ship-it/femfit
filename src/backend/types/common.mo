module {
  public type UserId = Principal;
  public type Timestamp = Int; // nanoseconds since epoch (Time.now())

  public type FitnessLevel = { #beginner; #intermediate; #advanced };
  public type FitnessGoal  = { #weightLoss; #muscleGain; #maintenance };

  public type DietaryPreference = {
    #none;
    #vegetarian;
    #vegan;
    #glutenFree;
    #dairyFree;
  };

  public type HealthCondition = {
    #pcos;
    #pcod;
    #diabetes;
    #thyroidDisorder;
    #hormoneImbalance;
    #anemia;
    #hypertension;
    #heartCondition;
    #none;
  };

  public type CyclePhase = {
    #menstrual;
    #follicular;
    #ovulatory;
    #luteal;
  };

  public type SubscriptionTier = {
    #freeTrial;
    #weekly;
    #monthly;
    #premium;
  };

  public type SubscriptionStatus = {
    #active;
    #expired;
    #cancelled;
  };
};
