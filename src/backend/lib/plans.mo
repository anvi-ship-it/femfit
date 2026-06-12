import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";
import PlanTypes "../types/plans";

module {
  public type DailyLog        = PlanTypes.DailyLog;
  public type LoggedMeal      = PlanTypes.LoggedMeal;
  public type WorkoutTemplate = PlanTypes.WorkoutTemplate;
  public type MealTemplate    = PlanTypes.MealTemplate;

  // ── Workout Templates ──────────────────────────────────────────────────────

  // Select the workout template matching the given phase and goal.
  public func getWorkoutTemplate(
    phase : Common.CyclePhase,
    goal  : Common.FitnessGoal,
  ) : ?WorkoutTemplate {
    let templates = workoutTemplates();
    templates.find(func(t : WorkoutTemplate) : Bool {
      t.phase == phase and t.goal == goal
    });
  };

  // Select the meal template matching the given phase and dietary preference.
  public func getMealTemplate(
    phase    : Common.CyclePhase,
    dietPref : Common.DietaryPreference,
  ) : ?MealTemplate {
    let templates = mealTemplates();
    // First try exact match; fall back to #none preference for the same phase
    switch (templates.find(func(t : MealTemplate) : Bool { t.phase == phase and t.dietPref == dietPref })) {
      case (?t) { ?t };
      case null {
        templates.find(func(t : MealTemplate) : Bool { t.phase == phase and t.dietPref == #none });
      };
    };
  };

  // ── Daily Log ──────────────────────────────────────────────────────────────

  // Get or initialise today's log for a user.
  public func getDailyLog(
    logs   : Map.Map<Text, DailyLog>,
    userId : Principal,
    date   : Text,
  ) : DailyLog {
    let key = logKey(userId, date);
    switch (logs.get(key)) {
      case (?log) { log };
      case null {
        let empty : DailyLog = {
          date             = date;
          workoutDone      = false;
          workoutTimestamp = null;
          mealsLogged      = [];
          waterMl          = 0;
          weightKg         = null;
        };
        empty;
      };
    };
  };

  // Mark today's workout as completed.
  public func logWorkoutComplete(
    logs      : Map.Map<Text, DailyLog>,
    userId    : Principal,
    date      : Text,
    timestamp : Int,
  ) : () {
    let key     = logKey(userId, date);
    let current = getDailyLog(logs, userId, date);
    let updated : DailyLog = { current with
      workoutDone      = true;
      workoutTimestamp = ?timestamp;
    };
    logs.add(key, updated);
  };

  // Append a meal log entry for today.
  public func logMeal(
    logs      : Map.Map<Text, DailyLog>,
    userId    : Principal,
    date      : Text,
    mealName  : Text,
    timestamp : Int,
  ) : () {
    let key     = logKey(userId, date);
    let current = getDailyLog(logs, userId, date);
    let newMeal : LoggedMeal = { mealName; timestamp };
    let updated : DailyLog = { current with
      mealsLogged = current.mealsLogged.concat([newMeal]);
    };
    logs.add(key, updated);
  };

  // Update water intake (ml) for the day.
  public func logWater(
    logs   : Map.Map<Text, DailyLog>,
    userId : Principal,
    date   : Text,
    ml     : Nat,
  ) : () {
    let key     = logKey(userId, date);
    let current = getDailyLog(logs, userId, date);
    let updated : DailyLog = { current with waterMl = current.waterMl + ml };
    logs.add(key, updated);
  };

  // Log optional weight entry for the day.
  public func logWeight(
    logs     : Map.Map<Text, DailyLog>,
    userId   : Principal,
    date     : Text,
    weightKg : Float,
  ) : () {
    let key     = logKey(userId, date);
    let current = getDailyLog(logs, userId, date);
    let updated : DailyLog = { current with weightKg = ?weightKg };
    logs.add(key, updated);
  };

  // Composite log key: "<principalText>:<date>"
  public func logKey(userId : Principal, date : Text) : Text {
    userId.toText() # ":" # date;
  };

  // ── Pre-set Template Data ──────────────────────────────────────────────────

  func workoutTemplates() : [WorkoutTemplate] {
    [
      // ── Menstrual ──
      {
        id = "w-menstrual-weightloss"; title = "Gentle Restore Flow";
        phase = #menstrual; goal = #weightLoss; durationMin = 25;
        exercises = [
          { name = "Cat-Cow Stretch"; sets = 3; reps = "10"; notes = "Breathe deeply" },
          { name = "Child's Pose Hold"; sets = 3; reps = "30 sec"; notes = "Relax fully" },
          { name = "Seated Forward Fold"; sets = 3; reps = "30 sec"; notes = "No strain" },
          { name = "Supine Twist"; sets = 2; reps = "30 sec each"; notes = "Both sides" }
        ];
      },
      {
        id = "w-menstrual-musclegain"; title = "Menstrual Phase Rest";
        phase = #menstrual; goal = #muscleGain; durationMin = 20;
        exercises = [
          { name = "Foam Rolling"; sets = 1; reps = "5 min"; notes = "Full body" },
          { name = "Hip Flexor Stretch"; sets = 3; reps = "30 sec each"; notes = "Light stretch" },
          { name = "Glute Bridge"; sets = 3; reps = "8"; notes = "Slow, controlled" }
        ];
      },
      {
        id = "w-menstrual-maintenance"; title = "Menstrual Restore";
        phase = #menstrual; goal = #maintenance; durationMin = 20;
        exercises = [
          { name = "Walking"; sets = 1; reps = "15 min"; notes = "Easy pace" },
          { name = "Seated Yoga Flow"; sets = 1; reps = "5 min"; notes = "Gentle" }
        ];
      },
      // ── Follicular ──
      {
        id = "w-follicular-weightloss"; title = "Follicular Fat Burn";
        phase = #follicular; goal = #weightLoss; durationMin = 40;
        exercises = [
          { name = "Jump Rope"; sets = 4; reps = "45 sec"; notes = "Rest 15 sec" },
          { name = "Squat Jump"; sets = 3; reps = "12"; notes = "Land softly" },
          { name = "Mountain Climbers"; sets = 3; reps = "20"; notes = "Fast pace" },
          { name = "Bicycle Crunches"; sets = 3; reps = "16"; notes = "Alternate sides" },
          { name = "High Knees"; sets = 3; reps = "30 sec"; notes = "Drive knees up" }
        ];
      },
      {
        id = "w-follicular-musclegain"; title = "Follicular Strength Build";
        phase = #follicular; goal = #muscleGain; durationMin = 50;
        exercises = [
          { name = "Barbell Squat"; sets = 4; reps = "8"; notes = "Progressive overload" },
          { name = "Romanian Deadlift"; sets = 3; reps = "10"; notes = "Hip hinge" },
          { name = "Dumbbell Bench Press"; sets = 3; reps = "10"; notes = "Controlled descent" },
          { name = "Pull-Up / Lat Pulldown"; sets = 3; reps = "8"; notes = "Full ROM" },
          { name = "Overhead Press"; sets = 3; reps = "10"; notes = "Brace core" }
        ];
      },
      {
        id = "w-follicular-maintenance"; title = "Follicular Cardio Mix";
        phase = #follicular; goal = #maintenance; durationMin = 35;
        exercises = [
          { name = "Brisk Walk / Light Jog"; sets = 1; reps = "15 min"; notes = "Zone 2" },
          { name = "Bodyweight Squats"; sets = 3; reps = "15"; notes = "" },
          { name = "Push-Ups"; sets = 3; reps = "10"; notes = "Modify if needed" },
          { name = "Plank"; sets = 3; reps = "30 sec"; notes = "" }
        ];
      },
      // ── Ovulatory ──
      {
        id = "w-ovulatory-weightloss"; title = "Peak Power HIIT";
        phase = #ovulatory; goal = #weightLoss; durationMin = 45;
        exercises = [
          { name = "Burpees"; sets = 4; reps = "10"; notes = "Full body effort" },
          { name = "Sprint Intervals"; sets = 6; reps = "20 sec on/40 sec off"; notes = "All-out sprint" },
          { name = "Jump Lunges"; sets = 3; reps = "12 each"; notes = "Explosive" },
          { name = "Kettlebell Swings"; sets = 3; reps = "15"; notes = "Hip power" },
          { name = "Box Jumps"; sets = 3; reps = "10"; notes = "Soft landing" }
        ];
      },
      {
        id = "w-ovulatory-musclegain"; title = "Ovulatory Power Day";
        phase = #ovulatory; goal = #muscleGain; durationMin = 55;
        exercises = [
          { name = "Deadlift"; sets = 5; reps = "5"; notes = "Heavy load" },
          { name = "Hip Thrust"; sets = 4; reps = "8"; notes = "Full squeeze" },
          { name = "Dumbbell Row"; sets = 4; reps = "10"; notes = "Drive elbow back" },
          { name = "Dips"; sets = 3; reps = "10"; notes = "Chest forward" },
          { name = "Face Pulls"; sets = 3; reps = "15"; notes = "External rotation" }
        ];
      },
      {
        id = "w-ovulatory-maintenance"; title = "Ovulatory Active Day";
        phase = #ovulatory; goal = #maintenance; durationMin = 40;
        exercises = [
          { name = "Cycling or Swimming"; sets = 1; reps = "25 min"; notes = "Moderate intensity" },
          { name = "Core Circuit"; sets = 3; reps = "45 sec each exercise"; notes = "Plank, side plank, dead bug" }
        ];
      },
      // ── Luteal ──
      {
        id = "w-luteal-weightloss"; title = "Luteal Steady Burn";
        phase = #luteal; goal = #weightLoss; durationMin = 35;
        exercises = [
          { name = "Power Walk"; sets = 1; reps = "20 min"; notes = "Brisk, incline if possible" },
          { name = "Goblet Squat"; sets = 3; reps = "12"; notes = "Moderate weight" },
          { name = "Step-Ups"; sets = 3; reps = "12 each"; notes = "Controlled" },
          { name = "Banded Glute Bridge"; sets = 3; reps = "15"; notes = "Squeeze at top" }
        ];
      },
      {
        id = "w-luteal-musclegain"; title = "Luteal Maintenance Lift";
        phase = #luteal; goal = #muscleGain; durationMin = 45;
        exercises = [
          { name = "Leg Press"; sets = 4; reps = "10"; notes = "Reduce weight slightly" },
          { name = "Seated Row"; sets = 3; reps = "12"; notes = "Slow eccentric" },
          { name = "Dumbbell Shoulder Press"; sets = 3; reps = "10"; notes = "" },
          { name = "Triceps Pushdown"; sets = 3; reps = "12"; notes = "" },
          { name = "Bicep Curl"; sets = 3; reps = "12"; notes = "" }
        ];
      },
      {
        id = "w-luteal-maintenance"; title = "Luteal Yoga & Mobility";
        phase = #luteal; goal = #maintenance; durationMin = 30;
        exercises = [
          { name = "Sun Salutation"; sets = 3; reps = "5 rounds"; notes = "Slow flow" },
          { name = "Pigeon Pose"; sets = 2; reps = "60 sec each"; notes = "Hip opener" },
          { name = "Legs-Up-The-Wall"; sets = 1; reps = "5 min"; notes = "Restorative" }
        ];
      }
    ];
  };

  func mealTemplates() : [MealTemplate] {
    [
      // ── Menstrual ──
      {
        id = "m-menstrual-none"; title = "Iron-Rich Desi Thali";
        phase = #menstrual; dietPref = #none; calories = 1700;
        meals = [
          { name = "Breakfast"; portion = "Palak besan chilla (2 pieces) with green chutney"; notes = "Iron-rich spinach" },
          { name = "Lunch"; portion = "Rajma chawal with jeera rice & kachumber salad"; notes = "Warming, iron-packed" },
          { name = "Dinner"; portion = "Mutton curry with bajra roti & stir-fried methi saag"; notes = "Omega-3 & iron boost" },
          { name = "Snack"; portion = "Dates (3) with roasted sesame chikki"; notes = "Jaggery & sesame for iron" }
        ];
      },
      {
        id = "m-menstrual-vegetarian"; title = "Shakti Iron Thali";
        phase = #menstrual; dietPref = #vegetarian; calories = 1650;
        meals = [
          { name = "Breakfast"; portion = "Methi paratha (2) with dahi & jaggery"; notes = "Iron from methi leaves" },
          { name = "Lunch"; portion = "Palak dal (masoor) with steamed rice & pickle"; notes = "Double iron from spinach & lentils" },
          { name = "Dinner"; portion = "Rajma curry with chapati & cucumber raita"; notes = "Protein-rich comfort meal" },
          { name = "Snack"; portion = "Roasted til (sesame) laddoo with warm milk"; notes = "Sesame is high in iron" }
        ];
      },
      {
        id = "m-menstrual-vegan"; title = "Vegan Loh Shakti Meal";
        phase = #menstrual; dietPref = #vegan; calories = 1600;
        meals = [
          { name = "Breakfast"; portion = "Ragi dosa (2) with coconut chutney & sambar"; notes = "Ragi is rich in iron & calcium" },
          { name = "Lunch"; portion = "Chana masala with jeera rice & raw onion salad"; notes = "Chickpeas for plant iron" },
          { name = "Dinner"; portion = "Moong dal khichdi with ghee-free tadka & papad"; notes = "Easy to digest, iron-rich" },
          { name = "Snack"; portion = "Dates & peanut chikki with coconut water"; notes = "Natural iron & electrolytes" }
        ];
      },
      {
        id = "m-menstrual-glutenfree"; title = "Gluten-Free Poshan Thali";
        phase = #menstrual; dietPref = #glutenFree; calories = 1700;
        meals = [
          { name = "Breakfast"; portion = "Sabudana khichdi with peanuts & lemon"; notes = "Gluten-free energy" },
          { name = "Lunch"; portion = "Egg curry with steamed rice & palak stir-fry"; notes = "High iron egg & spinach" },
          { name = "Dinner"; portion = "Chicken keema with bajra roti & onion salad"; notes = "Lean protein, iron-rich" },
          { name = "Snack"; portion = "Roasted makhana with dates & coconut water"; notes = "Light & nourishing" }
        ];
      },
      {
        id = "m-menstrual-dairyfree"; title = "Dairy-Free Desi Iron Bowl";
        phase = #menstrual; dietPref = #dairyFree; calories = 1680;
        meals = [
          { name = "Breakfast"; portion = "Besan chilla with palak stuffing & green chutney"; notes = "No dairy, iron-packed" },
          { name = "Lunch"; portion = "Fish curry (coastal style) with steamed rice & drumstick sabzi"; notes = "Iron & omega-3" },
          { name = "Dinner"; portion = "Masoor dal with jowar roti & methi sabzi"; notes = "Iron-rich lentils & greens" },
          { name = "Snack"; portion = "Sprouts chaat with lemon & rock salt"; notes = "Iron & vitamin C combo" }
        ];
      },
      // ── Follicular ──
      {
        id = "m-follicular-none"; title = "Urja Boost Thali";
        phase = #follicular; dietPref = #none; calories = 1900;
        meals = [
          { name = "Breakfast"; portion = "Poha with mustard seeds, curry leaves, peas & lemon"; notes = "Light energy-building start" },
          { name = "Lunch"; portion = "Chicken curry with steamed rice & fresh cucumber raita"; notes = "Protein for energy" },
          { name = "Dinner"; portion = "Grilled tandoori fish with jeera rice & mint chutney"; notes = "Lean protein, light dinner" },
          { name = "Snack"; portion = "Sprouts chaat with tomato, onion & chaat masala"; notes = "Fresh & energising" }
        ];
      },
      {
        id = "m-follicular-vegetarian"; title = "Navratri Shakti Plate";
        phase = #follicular; dietPref = #vegetarian; calories = 1850;
        meals = [
          { name = "Breakfast"; portion = "Idli (3) with sambar & coconut chutney"; notes = "Fermented for gut health" },
          { name = "Lunch"; portion = "Chole with puri (2) & kachumber salad"; notes = "Protein-packed chickpeas" },
          { name = "Dinner"; portion = "Palak paneer with 2 chapati & jeera rice"; notes = "Iron + protein combination" },
          { name = "Snack"; portion = "Lassi (sweet) with a banana"; notes = "Probiotic & energy" }
        ];
      },
      {
        id = "m-follicular-vegan"; title = "Vegan Taaza Thali";
        phase = #follicular; dietPref = #vegan; calories = 1800;
        meals = [
          { name = "Breakfast"; portion = "Vermicelli upma with vegetables & coconut chutney"; notes = "Light & energising" },
          { name = "Lunch"; portion = "Dal tadka (toor) with jeera rice & roasted papad"; notes = "Complete protein from dal-rice" },
          { name = "Dinner"; portion = "Vegetable daliya with peanuts & coconut milk tadka"; notes = "Fibre-rich whole grain" },
          { name = "Snack"; portion = "Murmura chaat with onion, tomato & lemon"; notes = "Light & refreshing" }
        ];
      },
      {
        id = "m-follicular-glutenfree"; title = "Gluten-Free Taazgi Meal";
        phase = #follicular; dietPref = #glutenFree; calories = 1900;
        meals = [
          { name = "Breakfast"; portion = "Oats idli (3) with tomato chutney & sambar"; notes = "Gluten-free energy breakfast" },
          { name = "Lunch"; portion = "Egg bhurji with steamed rice & cucumber salad"; notes = "High protein, no gluten" },
          { name = "Dinner"; portion = "Chicken stew with rice & stir-fried vegetables"; notes = "Light, nourishing dinner" },
          { name = "Snack"; portion = "Fruit chaat (mango, guava, pomegranate) with chaat masala"; notes = "Vitamin-rich snack" }
        ];
      },
      {
        id = "m-follicular-dairyfree"; title = "Dairy-Free Sphurti Thali";
        phase = #follicular; dietPref = #dairyFree; calories = 1870;
        meals = [
          { name = "Breakfast"; portion = "Poha with peanuts, mustard seeds & lemon"; notes = "No dairy, energising" },
          { name = "Lunch"; portion = "Mutton keema with jowar roti & onion salad"; notes = "High protein, dairy-free" },
          { name = "Dinner"; portion = "Sambar rice with drumstick & tomato"; notes = "South Indian comfort, no dairy" },
          { name = "Snack"; portion = "Roasted chana with lemon & black salt"; notes = "Protein-rich crunchy snack" }
        ];
      },
      // ── Ovulatory ──
      {
        id = "m-ovulatory-none"; title = "Tandoori Power Plate";
        phase = #ovulatory; dietPref = #none; calories = 2000;
        meals = [
          { name = "Breakfast"; portion = "Egg bhurji with 2 whole-wheat paratha & chaas"; notes = "High-protein peak fuel" },
          { name = "Lunch"; portion = "Chicken biryani with raita & onion salad"; notes = "Peak performance meal" },
          { name = "Dinner"; portion = "Grilled tandoori chicken (2 pieces) with roti & mint chutney"; notes = "Lean protein for peak day" },
          { name = "Snack"; portion = "Sattu drink (sweet) with roasted peanuts"; notes = "High protein sattu" }
        ];
      },
      {
        id = "m-ovulatory-vegetarian"; title = "Paneer Shakti Thali";
        phase = #ovulatory; dietPref = #vegetarian; calories = 1950;
        meals = [
          { name = "Breakfast"; portion = "Paneer paratha (2) with dahi & green chutney"; notes = "High-protein breakfast" },
          { name = "Lunch"; portion = "Dal makhani with jeera rice & 1 naan"; notes = "Protein-rich comfort" },
          { name = "Dinner"; portion = "Palak paneer with 2 roti & cucumber raita"; notes = "Iron + protein peak meal" },
          { name = "Snack"; portion = "Roasted makhana with pumpkin seeds & coconut water"; notes = "Antioxidant-rich snack" }
        ];
      },
      {
        id = "m-ovulatory-vegan"; title = "Vegan Peak Urja Bowl";
        phase = #ovulatory; dietPref = #vegan; calories = 1900;
        meals = [
          { name = "Breakfast"; portion = "Thepla (2) with coconut chutney & moong sprouts salad"; notes = "High-fibre peak start" },
          { name = "Lunch"; portion = "Rajma chawal with jeera rice & onion-tomato salad"; notes = "High-protein vegan meal" },
          { name = "Dinner"; portion = "Baingan bharta with bajra roti & roasted papad"; notes = "Nutrient-dense vegan dinner" },
          { name = "Snack"; portion = "Sprouts chaat with pomegranate seeds & lemon"; notes = "Peak protein from sprouts" }
        ];
      },
      {
        id = "m-ovulatory-glutenfree"; title = "Gluten-Free Tej Thali";
        phase = #ovulatory; dietPref = #glutenFree; calories = 2000;
        meals = [
          { name = "Breakfast"; portion = "Ragi dosa (3) with sambar & peanut chutney"; notes = "Gluten-free high-protein start" },
          { name = "Lunch"; portion = "Fish curry (Goan-style) with steamed rice & papad"; notes = "Omega-3 peak day fuel" },
          { name = "Dinner"; portion = "Palak chicken with bajra roti & cucumber raita"; notes = "Iron + lean protein" },
          { name = "Snack"; portion = "Peanut chikki with coconut water & banana"; notes = "Natural energy boost" }
        ];
      },
      {
        id = "m-ovulatory-dairyfree"; title = "Dairy-Free Tej Meal";
        phase = #ovulatory; dietPref = #dairyFree; calories = 1980;
        meals = [
          { name = "Breakfast"; portion = "Moong dal chilla (2) with tomato chutney & sprouts"; notes = "High-protein dairy-free start" },
          { name = "Lunch"; portion = "Chicken biryani with onion raita (coconut yoghurt) & salad"; notes = "Peak performance lunch" },
          { name = "Dinner"; portion = "Masala fish curry with steamed rice & stir-fried beans"; notes = "Omega-3 & lean protein" },
          { name = "Snack"; portion = "Sattu sherbet with roasted chana"; notes = "High-protein dairy-free snack" }
        ];
      },
      // ── Luteal ──
      {
        id = "m-luteal-none"; title = "Aaram Wali Thali";
        phase = #luteal; dietPref = #none; calories = 1850;
        meals = [
          { name = "Breakfast"; portion = "Aloo paratha (2) with dahi & pickle"; notes = "Comforting serotonin boost" },
          { name = "Lunch"; portion = "Kadhi pakora with jeera rice & aam papad"; notes = "Warm comfort lunch" },
          { name = "Dinner"; portion = "Chicken curry with 2 roti & stir-fried lauki"; notes = "Warm nourishing dinner" },
          { name = "Snack"; portion = "Haldi doodh (golden milk) with peanut chikki"; notes = "Anti-inflammatory turmeric" }
        ];
      },
      {
        id = "m-luteal-vegetarian"; title = "Sukoon Vegetarian Thali";
        phase = #luteal; dietPref = #vegetarian; calories = 1800;
        meals = [
          { name = "Breakfast"; portion = "Daliya (broken wheat porridge) with jaggery, nuts & warm milk"; notes = "Mood-lifting warm breakfast" },
          { name = "Lunch"; portion = "Dal makhani with 2 roti & cucumber raita"; notes = "Comfort dal, rich in tryptophan" },
          { name = "Dinner"; portion = "Moong dal khichdi with ghee & roasted papad"; notes = "Easy to digest comfort meal" },
          { name = "Snack"; portion = "Haldi doodh with banana & cashews"; notes = "Calming anti-inflammatory snack" }
        ];
      },
      {
        id = "m-luteal-vegan"; title = "Vegan Sukoon Thali";
        phase = #luteal; dietPref = #vegan; calories = 1750;
        meals = [
          { name = "Breakfast"; portion = "Upma with cashews & curry leaves & coconut chutney"; notes = "Warming mood-support breakfast" },
          { name = "Lunch"; portion = "Methi dal (fenugreek lentils) with jeera rice & papad"; notes = "Magnesium from fenugreek" },
          { name = "Dinner"; portion = "Vegetable khichdi with coconut oil tadka & roasted vegetables"; notes = "Comforting one-pot meal" },
          { name = "Snack"; portion = "Warm coconut milk with jaggery & roasted til"; notes = "Soothing vegan golden drink" }
        ];
      },
      {
        id = "m-luteal-glutenfree"; title = "Gluten-Free Aaram Meal";
        phase = #luteal; dietPref = #glutenFree; calories = 1850;
        meals = [
          { name = "Breakfast"; portion = "Sabudana khichdi with peanuts & sendha namak"; notes = "Gluten-free comforting start" },
          { name = "Lunch"; portion = "Chicken stew with steamed rice & stir-fried palak"; notes = "Warm nourishing comfort" },
          { name = "Dinner"; portion = "Masoor dal with bajra roti & lauki sabzi"; notes = "Warm & easy to digest" },
          { name = "Snack"; portion = "Haldi doodh (with coconut milk option) & roasted makhana"; notes = "Anti-inflammatory comfort" }
        ];
      },
      {
        id = "m-luteal-dairyfree"; title = "Dairy-Free Sukoon Bowl";
        phase = #luteal; dietPref = #dairyFree; calories = 1830;
        meals = [
          { name = "Breakfast"; portion = "Poha with peanuts, jaggery & coconut flakes"; notes = "Comforting dairy-free start" },
          { name = "Lunch"; portion = "Rasam rice with papad & lemon pickle"; notes = "South Indian soothing comfort" },
          { name = "Dinner"; portion = "Egg curry with 2 chapati & stir-fried cabbage"; notes = "Warming protein-rich dinner" },
          { name = "Snack"; portion = "Warm coconut water with dates & roasted peanuts"; notes = "Dairy-free calming snack" }
        ];
      }
    ];
  };
};
