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
    eye_color?: string;
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
    parts.push(`${skinMap[appearance.skin_tone]}`);
  }

  // Eye color
  const eyeMap: Record<string, string> = {
    brown: "brown eyes",
    dark_brown: "dark brown eyes",
    green: "green eyes",
    blue: "blue eyes",
    gray: "gray eyes",
  };
  if (appearance.eye_color && eyeMap[appearance.eye_color]) {
    parts.push(eyeMap[appearance.eye_color]);
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
    tight_curly: "tight curly",
    coily: "afro-textured",
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

  const hairLength = lengthMap[appearance.hair_length] || "";
  const hairType = typeMap[appearance.hair_type] || "";
  const hairColor = colorMap[appearance.hair_color] || "";

  // Build hair description using style anchor templates
  // Import style mapping for anchor generation
  const styleAnchors: Record<string, string> = {
    // Girl styles
    loose: `loose ${hairType}`,
    braid: `braided ${hairType}`,
    ponytail: `${hairType} in a ponytail`,
    bob: `bob cut with ${hairType}`,
    half_up: `half-up ${hairType}`,
    two_braids: `${hairType} in two braids`,
    updo: `${hairType} in an updo`,
    short_afro: "short afro",
    afro: "afro hairstyle",
    afro_puffs: "afro puffs",
    braids: "braided hair",
    // Boy styles
    short: `short ${hairType}`,
    side_part: `side-parted ${hairType}`,
    undercut: `undercut with ${hairType} on top`,
    buzz_cut: "buzz cut",
    medium_length: `medium-length ${hairType}`,
    surfer: "medium-length tousled wavy hair",
    curls_loose: "loose curly hair",
    twist_out: "twist-out curly hair",
    tapered: "tapered curly hair",
  };

  const stylePhrase = styleAnchors[appearance.hair_style];

  if (stylePhrase) {
    // For styles that already describe length (like buzz cut, short afro), skip length prefix
    const skipLength = ["short_afro", "afro", "afro_puffs", "braids", "buzz_cut", "surfer", "curls_loose", "twist_out", "tapered"].includes(appearance.hair_style);
    if (skipLength) {
      parts.push(`${hairColor} hair, ${stylePhrase}`);
    } else {
      parts.push(`${hairLength} ${hairColor} hair, ${stylePhrase}`);
    }
  } else {
    // Fallback: just describe hair without style
    const hairParts = [hairLength, hairType, hairColor, "hair"].filter(Boolean);
    parts.push(hairParts.join(" "));
  }

  if (appearance.glasses) {
    parts.push("wearing glasses");
  }

  return parts.join(", ");
}
