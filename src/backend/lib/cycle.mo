import List "mo:core/List";
import Common "../types/common";
import CycleTypes "../types/cycle";
import ProfileTypes "../types/profile";

module {
  public type CyclePhase        = Common.CyclePhase;
  public type CycleEntry        = CycleTypes.CycleEntry;
  public type CycleInfo         = CycleTypes.CycleInfo;
  public type OnboardingProfile = ProfileTypes.OnboardingProfile;

  let NS_PER_DAY : Int = 86_400_000_000_000;

  // Derive which cycle phase the user is currently in given profile data
  // and the current time in nanoseconds.
  public func getCurrentPhase(profile : OnboardingProfile, nowNs : Int) : CyclePhase {
    let dayOfCycle = calcDayOfCycle(profile.cycleStartDate, profile.cycleLengthDays, nowNs);
    phaseFromDay(dayOfCycle, profile.cycleLengthDays, profile.periodDurationDays);
  };

  // Build a full CycleInfo (phase, day, tip) for the dashboard.
  public func buildCycleInfo(profile : OnboardingProfile, nowNs : Int) : CycleInfo {
    let dayOfCycle = calcDayOfCycle(profile.cycleStartDate, profile.cycleLengthDays, nowNs);
    let phase = phaseFromDay(dayOfCycle, profile.cycleLengthDays, profile.periodDurationDays);
    let (phaseStartDay, phaseLengthDays) = phaseWindow(phase, profile.cycleLengthDays, profile.periodDurationDays);
    let tip = getPhaseTip(phase);
    {
      currentPhase    = phase;
      dayOfCycle      = dayOfCycle;
      phaseStartDay   = phaseStartDay;
      phaseLengthDays = phaseLengthDays;
      cycleTip        = tip;
    };
  };

  // Return last 3 months of cycle history entries derived from a single
  // cycle start date and length (generates synthetic history for display).
  public func getCycleHistory(profile : OnboardingProfile, nowNs : Int) : [CycleEntry] {
    let cycleNs : Int = profile.cycleLengthDays * NS_PER_DAY;
    // Compute how many full cycles fit in 90 days
    let maxCycles : Nat = 90 / profile.cycleLengthDays + 1;
    let entries = List.empty<CycleEntry>();
    var i : Nat = 0;
    while (i < maxCycles) {
      let startNs = profile.cycleStartDate - (i : Int) * cycleNs;
      // Only include cycles that started in the past and within 3 months
      if (startNs <= nowNs and startNs >= nowNs - 90 * NS_PER_DAY) {
        entries.add({ startDate = startNs; lengthDays = profile.cycleLengthDays });
      };
      i += 1;
    };
    entries.toArray();
  };

  // Phase-specific tip text for a given phase.
  public func getPhaseTip(phase : CyclePhase) : Text {
    switch (phase) {
      case (#menstrual) {
        "Rest and restore: focus on gentle movement, iron-rich foods, and staying hydrated. Listen to your body — it's okay to ease off intensity today."
      };
      case (#follicular) {
        "Energy is rising! This is a great time to try new workouts, experiment with new recipes, and set fresh intentions for your cycle ahead."
      };
      case (#ovulatory) {
        "You're at peak energy and strength. Lean into high-intensity training, social connection, and nutrient-dense whole foods to support ovulation."
      };
      case (#luteal) {
        "Support your body with complex carbs, magnesium-rich foods, and moderate exercise. Prioritise sleep and stress-reducing activities this week."
      };
    };
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  // Returns the 1-based day within the current cycle (1..cycleLengthDays).
  func calcDayOfCycle(cycleStartNs : Int, cycleLengthDays : Nat, nowNs : Int) : Nat {
    let elapsedNs = nowNs - cycleStartNs;
    if (elapsedNs < 0) {
      // Clock or data anomaly — treat as day 1
      return 1;
    };
    let elapsedDays = (elapsedNs / NS_PER_DAY).toNat();
    let dayInCycle  = elapsedDays % cycleLengthDays + 1; // 1-based
    dayInCycle;
  };

  // Assign a phase from the 1-based day within the cycle.
  // periodDurationDays controls the end of the menstrual phase (default 5).
  // Follicular starts the day after menstrual ends.
  // Ovulatory is anchored at days 14–16; luteal fills the rest.
  func phaseFromDay(day : Nat, _cycleLengthDays : Nat, periodDurationDays : ?Nat) : CyclePhase {
    let menstrualEnd = resolvedPeriodDays(periodDurationDays);
    let follicularEnd = 13; // ovulatory anchor starts at 14
    if (day <= menstrualEnd) {
      #menstrual;
    } else if (day <= follicularEnd) {
      #follicular;
    } else if (day <= 16) {
      #ovulatory;
    } else {
      #luteal;
    };
  };

  // Returns (phaseStartDay, phaseLengthDays) for a given phase.
  // Menstrual end is driven by periodDurationDays (default 5).
  func phaseWindow(phase : CyclePhase, cycleLengthDays : Nat, periodDurationDays : ?Nat) : (Nat, Nat) {
    let menstrualEnd = resolvedPeriodDays(periodDurationDays);
    switch (phase) {
      case (#menstrual)  { (1, menstrualEnd) };
      case (#follicular) { (menstrualEnd + 1, 13 - menstrualEnd) };
      case (#ovulatory)  { (14, 3) };
      case (#luteal)     { (17, cycleLengthDays - 16) };
    };
  };

  // Resolve the effective menstrual phase length from an optional field.
  // Falls back to 5 when null or 0.
  func resolvedPeriodDays(periodDurationDays : ?Nat) : Nat {
    switch (periodDurationDays) {
      case (?d) { if (d == 0) 5 else d };
      case null { 5 };
    };
  };
};
