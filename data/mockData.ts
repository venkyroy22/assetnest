export interface PromptSection {
  label: string;
  content: string;
}

export interface PromptItem {
  title: string;
  slug: string;
  description: string;
  image: string;
  author: string;
  sections: PromptSection[];
  externalUrl?: string;
}

export const aiPrompts: PromptItem[] = [
  {
    title: "Editorial Heroic Portrait",
    slug: "heroic-portrait",
    description: "Professional editorial lighting setup for 'Heroic' feel portraits.",
    image: "/promptsimg/Gemini_Generated_Image_l454rnl454rnl454.png",
    author: "Gemini",
    sections: [
      { 
        label: "ROLE & AESTHETIC", 
        content: "You are a world-class editorial portrait photographer specializing in dramatic, colorful studio lighting. Your task is to create a powerful, dynamic portrait with a \"heroic\" feel." 
      },
      { 
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)", 
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\nPreservation: You must keep their exact facial features, skin tone, hairstyle, and natural likeness perfectly unchanged.\nUniversal Application: Apply the lighting and angle to the subject regardless of gender." 
      },
      { 
        label: "WARDROBE & STYLING", 
        content: "Attire: A premium Black Pique Polo Shirt\nTexture: Visible cotton pique mesh texture\nFit: Fitted and sharp.\nColor: Deep matte black (to contrast with the bright background).\nExpression: Serious, intense, focused. The subject is looking off-camera into the space above, not directly at the lens." 
      },
      { 
        label: "SCENE & COMPOSITION", 
        content: "Background: A vibrant, solid orange-red backdrop. It should feature smooth, intense color gradients without distinct patterns, creating a \"hot\" atmosphere.\nCamera Angle (CRITICAL): Low-angle shot (looking up at the subject). This perspective should make the subject look powerful and dominant.\nFraming: Medium close-up (focus on face and shoulders)." 
      },
      { 
        label: "LIGHTING (DRAMATIC & COLORFUL)", 
        content: "Palette: Dominated by vibrant orange and deep red hues.\nKey Light: Strong, directional lighting that casts deep, dramatic shadows on the face (chiaroscuro effect), emphasizing facial structure.\nRim Light: A strong, dramatic edge light (or color cast) that separates the subject's shoulders and head from the intensely lit background.\nMood: Mysterious, intense, high-contrast studio aesthetic." 
      },
      { 
        label: "TECHNICAL QUALITY", 
        content: "Style: Photorealistic, highly detailed.\nTexture: Sharp focus on the face, contrasting with the smooth gradients of the background. retain natural pores and texture." 
      }
    ]
  },
  {
    title: "Monochrome Dutch Tilt Portrait",
    slug: "monochrome-dutch-tilt",
    description: "Cinematic black & white portrait with surreal diagonal light patterns and high texture detail.",
    image: "/promptsimg/Gemini_Generated_Image_7lmyk07lmyk07lmy.png",
    author: "Gemini",
    sections: [
      {
        label: "FULL PROMPT",
        content: "A hyperrealistic 8K black and white cinematic portrait of GIVEN IMAGE with natural freckles and textured skin, captured with a Dutch tilt camera angle. The composition is dynamic and diagonal, the subject framed from the shoulders up, his head slightly tilted in the opposite direction, enhancing the sense of imbalance and tension. Bright sunlight pours through a textured surface, breaking into\nglowing wavy lines that sweep diagonally across his face and body. The beams ripple like underwater reflections, refracting into surreal, fluid patterns. Shadows remain in soft mid-gray tones, giving the portrait a smooth tonal balance, while the luminous streaks appear vivid and sharp, dominating the scene. Person's skin is shown with lifelike detail - visible pores, faint stubble, freckles, and subtle imperfections-catching the light in natural highlights. The wavy rays sculpt cheekbones, lips, and jawline, creating depth and surreal contrast. The background fades into smoky gray gradients with faint haze that makes the luminous streaks expand softly into the darkness. Fine cinematic grain overlays the frame, adding texture and analog realism. The overall mood is dramatic, surreal emotional - a monochrome editorial image where the tilted angle and wave-like light."
      }
    ]
  },
  {
    title: "Shattered Mirror Portrait",
    slug: "shattered-mirror-portrait",
    description: "Ultra-realistic 8K cinematic portrait featuring shattered glass reflections and low-key lighting.",
    image: "/promptsimg/Gemini_Generated_Image_bedjqybedjqybedj.png",
    author: "Gemini",
    sections: [
      {
        label: "FULL PROMPT",
        content: "Ultra-realistic 8K cinematic portrait of a man - use face reference exactly - with facial features identical to the uploaded image. He wears a dark, tailored three-piece suit and looks directly into the camera with a powerful, thoughtful expression, one hand resting on his chin in a confident pose. Surround him with shattered glass and broken mirror fragments reflecting distorted versions of his own face, creating a dramatic and commanding visual effect. Lighting is low-key and moody, with rich shadows and selective golden highlights accentuating his face and suit. The background remains dark and atmospheric. On the left hand only, add a silver watch and a silver ring. Style: hyper-realistic digital painting, luxury cinematic tone, deep contrast, refined details, and a bold, high-end editorial finish."
      }
    ]
  },
  {
    title: "Emerald Profile Portrait",
    slug: "emerald-profile-portrait",
    description: "Cinematic close-up profile portrait with saturated deep-green monochromatic lighting and high-fashion aesthetic.",
    image: "/promptsimg/Gemini_Generated_Image_3cqyo23cqyo23cqy.png",
    author: "Gemini",
    sections: [
      {
        label: "FULL PROMPT",
        content: "Hyper-realistic 8K cinematic close-up profile portrait of a stylish young man, preserving\n100% of the real facial identity from the uploaded image, with dark messy hair styled in a\nmodern mullet, a sparse goatee, and thick rectangular black sunglasses, looking slightly\ndownward with a calm, moody, introspective expression, accessorized with a dangling\nsilver earring, a thick silver link chain, and a tonger fine chain with a blade pendant, wearing a dark textured black jacket that subtly fades into shadow; the scene is dominated by rich, saturated deep-green monochromatic lighting, with a strong emerald backlight creating sharp rim lighting along his profile, hair, and jewelry, set against a smooth glowing deep-green background, using high-contrast chiaroscuro lighting to sculpt the face while obscuring parts in shadow and emphasizing realistic skin texture, metallic reflections, and hair detail, captured in cinematic studio photography with a high-fashion music-video aesthetic, ultra-sharp focus, volumetric lighting, deep shadows, realistic color grading, and an intense atmospheric mood."
      }
    ]
  },
  {
    title: "Icy Blue Futuristic Halo",
    slug: "icy-blue-futuristic-halo",
    description: "Futuristic closet-up portrait with a neon halo effect and cool monochromatic icy blue lighting.",
    image: "/promptsimg/Gemini_Generated_Image_vgqpw8vgqpw8vgqp.png",
    author: "Gemini",
    sections: [
      {
        label: "FULL PROMPT",
        content: "A close-up portrait framed from the shoulders up, captured in a dark studio\nenvironment with a strong minimalist and futuristic aesthetic. The UPLOADED subject is\nposed in three-quarter profile, wearing dark clothing such as a black turtleneck\nand metallic accessories, with reflective sunglasses that catch the ambient\nlight. A circular neon light positioned directly behind the subject creates a\nluminous halo effect, producing precise rim highlights along the head and\nshoulders. The lighting is cool and monochromatic, primarily in icy blue tones\n(~6500K), casting subtle reflections and soft gradients across the matte tex-\ntures. The background is a deep black (approx. HEX #020509), allowing the\nneon ring's cyan glow (approx."
      }
    ]
  },
  {
    title: "Minimalist Studio Suit Portrait",
    slug: "minimalist-studio-suit",
    description: "Artistic black and white portrait in a minimalist fashion studio with sharp tailored suit lines.",
    image: "/promptsimg/Gemini_Generated_Image_v0rvz9v0rvz9v0rv.png",
    author: "Gemini",
    sections: [
      {
        label: "FULL PROMPT",
        content: "Edit this image of a man into a black and white artistic portrait in a minimalist fashion studio. He is dressed in a tailored dark suit with sharp lines, paired with polished black shoes. He sits on a simple modern chair, leaning slightly forward with his hands clasped, giving an introspective and confident expression. Lighting is clean and controlled, using soft studio light to create sculpted shadows and highlight facial structure, textures, and fabric details. The background is plain, smooth gray to keep the focus on the subject. High contrast black and white grading emphasizes elegance and depth. Vertical 4:5 crop, cinematic editorial style - refined, timeless, and powerful."
      }
    ]
  }
];
