import Common "common";

module {
  // A single day entry of cycle history
  public type CycleEntry = {
    startDate   : Common.Timestamp;
    lengthDays  : Nat;
  };

  public type CycleInfo = {
    currentPhase    : Common.CyclePhase;
    dayOfCycle      : Nat;       // 1-based day within current cycle
    phaseStartDay   : Nat;       // cycle day when current phase began
    phaseLengthDays : Nat;       // expected length of current phase in days
    cycleTip        : Text;      // phase-specific tip
  };
};
