import { bestSide, musclesWorked } from "./muscles";

const bench = { primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"], sets: 4 };
const row = { primaryMuscles: ["middle back"], secondaryMuscles: ["biceps", "lats"], sets: 3 };
const curl = { primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"], sets: 2 };

describe("musclesWorked", () => {
  it("ranks the primary muscles above the helpers", () => {
    expect(musclesWorked([bench])).toEqual([
      { slug: "chest", intensity: 2 },
      { slug: "deltoids", intensity: 2 },
      { slug: "triceps", intensity: 2 },
    ]);
  });

  it("marks muscles under half the top score as secondary", () => {
    const muscles = musclesWorked([bench, row, curl]);
    expect(muscles[0]).toEqual({ slug: "upper-back", intensity: 2 });
    expect(muscles).toContainEqual({ slug: "chest", intensity: 2 });
    expect(muscles).toContainEqual({ slug: "forearm", intensity: 1 });
  });

  it("ignores muscles the map cannot draw and empty sessions", () => {
    expect(musclesWorked([{ primaryMuscles: ["tongue"], secondaryMuscles: [], sets: 3 }])).toEqual(
      [],
    );
    expect(musclesWorked([])).toEqual([]);
  });
});

describe("bestSide", () => {
  it("turns the body around for a back day", () => {
    expect(bestSide(musclesWorked([row]))).toBe("back");
    expect(bestSide(musclesWorked([bench]))).toBe("front");
  });
});
