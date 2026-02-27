/**
 * Build an English appearance description for the image generation character_anchor.
 * Used when the kid has set "Mein Look" so they appear like themselves in story illustrations.
 */
export function buildAppearanceAnchor(
  kidName: string,
  kidAge: number,
  kidGender: string,
  appearance: {
    skin_tone: string;
    hair_length: string;
    hair_type: string;
    hair_style: string;
    hair_color: string;
    glasses: boolean;
  } | null
): string {
  if (!appearance) {
    return `${kidAge}-year-old child named ${kidName}`;
  }

  const parts: string[] = [];

  const genderWord = kidGender === "female" ? "girl" : kidGender === "male" ? "boy" : "child";
  parts.push(`${kidAge}-year-old ${genderWord}`);

  const skinMap: Record<string, string> = {
    light: "light skin",
    medium_light: "light-medium skin",
    medium: "medium skin tone",
    medium_dark: "medium-dark skin",
    dark: "dark skin",
  };
  if (appearance.skin_tone && skinMap[appearance.skin_tone]) {
    parts.push(`with ${skinMap[appearance.skin_tone]}`);
  }

  const lengthMap: Record<string, string> = {
    very_short: "very short",
    short: "short",
    medium: "medium-length",
    long: "long",
  };
  const typeMap: Record<string, string> = {
    straight: "straight",
    wavy: "wavy",
    curly: "curly",
    coily: "coily",
  };
  const colorMap: Record<string, string> = {
    black: "black",
    dark_brown: "dark brown",
    brown: "brown",
    light_brown: "light brown",
    blonde: "blonde",
    light_blonde: "light blonde",
    red: "red",
    auburn: "auburn",
    ginger: "ginger",
  };
  const styleMap: Record<string, string> = {
    loose: "",
    ponytail: "in a ponytail",
    braids: "in braids",
    pigtails: "in pigtails",
    bun: "in a bun",
    bangs: "with bangs",
  };

  const hairLength = lengthMap[appearance.hair_length] || "";
  const hairType = typeMap[appearance.hair_type] || "";
  const hairColor = colorMap[appearance.hair_color] || "";
  const hairStyle = styleMap[appearance.hair_style] || "";

  const hairParts = [hairLength, hairType, hairColor, "hair"].filter(Boolean);
  let hairDesc = hairParts.join(" ");
  if (hairStyle) hairDesc += ` ${hairStyle}`;
  parts.push(hairDesc);

  if (appearance.glasses) {
    parts.push("wearing glasses");
  }

  return parts.join(", ");
}
