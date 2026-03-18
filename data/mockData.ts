const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/drljj29ua/image/upload/f_auto,q_auto/assetnest/promptsimg/";

export interface PromptSection {
  label: string;
  content: string;
}

export interface PromptItem {
  title: string;
  slug: string;
  description: string;
  images: string[];
  author: string;
  sections: PromptSection[];
  externalUrl?: string;
}

export const aiPrompts: PromptItem[] = [
  {
    title: "Editorial Heroic Portrait",
    slug: "heroic-portrait",
    description: "Professional editorial lighting setup for 'Heroic' feel portraits.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_l454rnl454rnl454.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_1e7stc1e7stc1e7s.png`
    ],
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
    title: "Matchflame Close-Up Portrait",
    slug: "matchflame-closeup-portrait",
    description: "Dramatic cinematic close-up portrait with a lit match flame as the key light source against a deep warm red background.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_eueuboeueuboeueu.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_9wzf9i9wzf9i9wzf.png`
    ],
    author: "Gemini",
    sections: [
      {
        label: "ROLE & AESTHETIC",
        content: "You are a world-class editorial portrait photographer specializing in dramatic, cinematic low-key lighting. Your task is to create an intense, atmospheric portrait with a mysterious feel centered around a small practical flame as the visual focal point."
      },
      {
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)",
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\nPreservation: You must keep their exact facial features, skin tone, hairstyle, and natural likeness perfectly unchanged.\nUniversal Application: Apply the lighting and camera angle to the subject regardless of gender."
      },
      {
        label: "WARDROBE & STYLING",
        content: "Attire: A slightly unbuttoned light-colored shirt made of soft fabric with a turn-down collar.\nTexture: Smooth fabric texture with natural folds.\nFit: Relaxed and natural.\nColor: Light neutral tone contrasting against the deep background.\nExpression: Calm, intense, and focused. The subject is looking directly toward the camera through strands of hair.\n\nAccessories: Several silver metal chains of varying lengths around the neck, along with multiple metal rings on the fingers. Nails are medium length with glossy brown polish."
      },
      {
        label: "SCENE & COMPOSITION",
        content: "Background: A dense, uniform deep warm red backdrop with minimal visual detail. The background should feel heavy and atmospheric without visible patterns.\n\nCamera Angle (CRITICAL): Eye-level close portrait framing the face and hand prominently.\n\nFraming: Tight close-up composition focusing on the face, lips, fingers, and flame.\n\nPose: The subject’s right hand is raised to the face holding a thin wooden match between the fingers. The tip of the match burns with a bright flame positioned slightly above the lips. Loose strands of hair partially cover the face."
      },
      {
        label: "LIGHTING (DRAMATIC & CINEMATIC)",
        content: "Palette: Dominated by warm orange and deep red tones.\n\nKey Light: The primary light source is the lit match flame directly in front of the face, casting warm orange-yellow illumination onto the nose, lips, fingers, and lower facial contours.\n\nSecondary Light: A subtle warm fill light from the right side of the camera softly lifts shadows on the hair and cheek contour.\n\nShadow Behavior: Hard shadows from the hand and nose fall across the face due to the upward flame lighting.\n\nMood: Mysterious, intense, high-contrast cinematic portrait."
      },
      {
        label: "TECHNICAL QUALITY",
        content: "Style: Photorealistic, highly detailed.\nTexture: Sharp focus on the face and flame, with realistic skin pores and natural texture.\n\nImportant: The subject's face remains unchanged with natural features and realistic skin texture. Eye color remains unchanged. The image ratio should be portrait."
      }
    ]
  },
  {
    title: "Monochrome Dutch Tilt Portrait",
    slug: "monochrome-dutch-tilt",
    description: "Cinematic black & white portrait with surreal diagonal light patterns and high texture detail.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_7lmyk07lmyk07lmy.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_4eu1o04eu1o04eu1.png`
    ],
    author: "Gemini",
    sections: [
      {
        label: "ROLE & AESTHETIC",
        content: "You are a world-class cinematic portrait photographer specializing in dramatic monochrome editorial imagery. Your task is to create a hyperrealistic black-and-white portrait with a surreal, emotional atmosphere using directional light patterns and dynamic camera composition."
      },
      {
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)",
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\nPreservation: You must keep their exact facial features, skin translation into monochrome, hairstyle, and natural likeness perfectly unchanged.\nUniversal Application: Apply the lighting, camera angle, and visual effects to the subject regardless of gender while maintaining realistic identity and facial structure."
      },
      {
        label: "WARDROBE & STYLING",
        content: "Attire: Simple, neutral clothing visible only slightly within the frame due to the tight composition.\n\nTexture: Fabric appears natural and understated so the lighting patterns remain the dominant visual element.\n\nFit: Natural and relaxed.\n\nExpression: Calm, introspective, and emotionally intense. The subject maintains a neutral yet expressive gaze that enhances the dramatic atmosphere.\n\nSkin Detail: Natural freckles, faint stubble, and subtle imperfections remain visible. The skin surface shows realistic texture with visible pores and natural highlights."
      },
      {
        label: "SCENE & COMPOSITION",
        content: "Camera Angle (CRITICAL): Dutch tilt camera angle creating a diagonal and dynamic composition that introduces visual tension.\n\nFraming: Shoulder-up portrait framing, with the subject’s head slightly tilted in the opposite direction of the camera angle to intensify imbalance and visual drama.\n\nPose: The subject remains still and centered within the frame while the diagonal framing creates movement across the image.\n\nBackground: A soft smoky gray gradient background with faint atmospheric haze that allows light streaks to fade gradually into darkness."
      },
      {
        label: "LIGHTING (DRAMATIC & SURREAL)",
        content: "Palette: Pure monochrome black-and-white tonal range with rich blacks, luminous highlights, and smooth mid-gray transitions.\n\nKey Light: Bright sunlight passes through a textured surface, breaking into glowing wavy light lines that sweep diagonally across the subject’s face and body.\n\nLight Pattern: The beams ripple like underwater reflections, refracting into surreal fluid patterns that travel across the skin.\n\nShadow Behavior: Shadows remain soft and mid-gray, maintaining smooth tonal balance while allowing the luminous streaks to dominate the composition.\n\nLight Interaction: The wavy rays sculpt cheekbones, lips, and jawline, producing depth and surreal contrast while enhancing facial contours."
      },
      {
        label: "TECHNICAL QUALITY",
        content: "Style: Hyperrealistic 8K black-and-white cinematic portrait photography.\n\nTexture: Extremely detailed skin rendering with visible pores, freckles, faint facial hair, and natural imperfections.\n\nAtmosphere: Fine cinematic grain overlays the frame, adding analog texture and film realism.\n\nFocus: Sharp focus on the face and illuminated areas while the background fades softly into smoky gradients.\n\nMood: Dramatic, surreal, and emotional — a monochrome editorial portrait where the tilted angle and flowing wave-like light create tension and visual storytelling.\n\nImportant: The subject's face must remain unchanged with natural features and realistic skin texture. The image ratio should be portrait."
      }
    ]
  },
  {
    title: "Shattered Mirror Portrait",
    slug: "shattered-mirror-portrait",
    description: "Ultra-realistic 8K cinematic portrait featuring shattered glass reflections and low-key lighting.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_bedjqybedjqybedj.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_wdjvrjwdjvrjwdjv.png`
    ],
    author: "Gemini",
    sections: [
      {
        label: "ROLE & AESTHETIC",
        content: "You are a world-class cinematic portrait photographer and digital artist specializing in luxury editorial imagery with dramatic storytelling elements. Your task is to create an ultra-realistic portrait with a powerful, commanding atmosphere using reflective fragments and moody cinematic lighting."
      },
      {
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)",
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\n\nPreservation: The subject’s facial features must remain identical to the uploaded image. Maintain the exact face structure, skin texture, hairstyle, and natural likeness without alteration.\n\nUniversal Application: Apply all styling, lighting, and composition elements while preserving the subject’s identity regardless of gender."
      },
      {
        label: "WARDROBE & STYLING",
        content: "Attire: A dark, tailored three-piece suit designed with a refined, elegant silhouette.\n\nTexture: High-quality fabric with subtle texture visible in the jacket, vest, and shirt.\n\nFit: Structured and tailored to create a sharp, sophisticated editorial appearance.\n\nAccessories: On the left hand only, include a silver watch and a silver ring that complement the luxurious styling.\n\nExpression: The subject looks directly into the camera with a powerful, thoughtful expression, projecting confidence and authority.\n\nPose: One hand rests gently on the chin in a confident, contemplative pose, reinforcing a composed and commanding presence."
      },
      {
        label: "SCENE & COMPOSITION",
        content: "Background: A dark, atmospheric environment that enhances the cinematic mood while keeping the focus on the subject.\n\nFraming: A tight cinematic portrait framing the subject from the chest or shoulders upward.\n\nVisual Elements: Surround the subject with shattered glass and broken mirror fragments suspended around them.\n\nReflection Effect: The fractured mirror pieces reflect distorted variations of the subject’s own face, creating multiple fragmented reflections that intensify the dramatic composition.\n\nComposition Mood: The shattered reflections add tension and visual complexity while emphasizing the subject as the central figure."
      },
      {
        label: "LIGHTING (DRAMATIC & CINEMATIC)",
        content: "Palette: Dominated by deep shadows with selective warm golden highlights.\n\nKey Light: Low-key directional lighting focused primarily on the face, sculpting the cheekbones and jawline.\n\nAccent Lighting: Subtle golden highlights reflect across the suit fabric and mirror fragments, producing luminous edges.\n\nShadow Behavior: Rich, deep shadows maintain strong contrast and create a moody cinematic environment.\n\nOverall Mood: Intense, dramatic, and luxurious with a powerful editorial tone."
      },
      {
        label: "TECHNICAL QUALITY",
        content: "Style: Ultra-realistic 8K cinematic portrait rendered as a hyper-realistic digital painting.\n\nDetail: Refined details in facial texture, suit fabric, reflective glass fragments, and metallic accessories.\n\nContrast: Deep contrast between illuminated highlights and dark atmospheric background.\n\nFinish: Bold, high-end editorial aesthetic with polished cinematic realism.\n\nImportant: The subject's face must remain identical to the reference image with natural features and realistic skin texture. The image ratio should be portrait."
      }
    ]
  },
  {
    title: "Emerald Profile Portrait",
    slug: "emerald-profile-portrait",
    description: "Cinematic close-up profile portrait with saturated deep-green monochromatic lighting and high-fashion aesthetic.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_3cqyo23cqyo23cqy.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_x27iwsx27iwsx27i.png`
    ],
    author: "Gemini",
    sections: [
      {
        label: "ROLE & AESTHETIC",
        content: "You are a world-class cinematic portrait photographer specializing in high-fashion studio photography and dramatic monochromatic lighting. Your task is to create an intense, atmospheric portrait with a stylish music-video aesthetic, emphasizing strong rim lighting, sculpted shadows, and saturated green tones."
      },
      {
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)",
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\n\nPreservation: Preserve 100% of the real facial identity from the uploaded image. Maintain the exact facial structure, skin texture, eye placement, hairstyle base, and natural likeness without alteration.\n\nUniversal Application: Apply all lighting, styling, and compositional elements while keeping the subject’s identity perfectly recognizable regardless of gender."
      },
      {
        label: "WARDROBE & STYLING",
        content: "Hairstyle: Dark messy hair styled in a modern mullet-inspired texture, with loose layered strands that enhance the edgy fashion aesthetic while preserving the subject’s natural hairstyle.\n\nFacial Detail: Maintain the subject’s natural facial hair or smooth skin exactly as in the reference image without adding or removing features.\n\nAccessories: Thick rectangular black sunglasses covering the eyes, a dangling silver earring, a thick silver link chain around the neck, and a longer thin chain with a blade-shaped pendant.\n\nAttire: A dark textured black jacket with subtle fabric detail that gradually fades into shadow.\n\nExpression: Calm, moody, and introspective. The subject looks slightly downward, maintaining a composed and mysterious presence."
      },
      {
        label: "SCENE & COMPOSITION",
        content: "Framing: A tight cinematic close-up portrait focused on the side of the face.\n\nCamera Angle: Profile view of the subject’s face, emphasizing the silhouette of the nose, lips, jawline, and hair texture.\n\nPose: The head is angled slightly downward, creating a reflective and introspective mood while highlighting the profile contours.\n\nBackground: A smooth glowing deep-green backdrop with rich saturation and soft gradients that enhance the monochromatic atmosphere.\n\nComposition Mood: Minimalist yet striking, allowing lighting and silhouette to dominate the visual narrative."
      },
      {
        label: "LIGHTING (DRAMATIC & MONOCHROMATIC)",
        content: "Palette: Dominated by rich, saturated deep-green tones.\n\nKey Light: High-contrast chiaroscuro lighting sculpting the face, with parts of the profile illuminated while other areas fall into deep shadow.\n\nBack Light: A strong emerald backlight creating sharp rim lighting along the profile, hair edges, and metallic jewelry.\n\nLight Interaction: The green illumination highlights realistic skin texture, metallic reflections on the chains and earring, and individual strands of hair.\n\nAtmosphere: Volumetric lighting subtly diffuses through the scene, adding depth and cinematic atmosphere."
      },
      {
        label: "TECHNICAL QUALITY",
        content: "Style: Hyper-realistic 8K cinematic studio portrait photography with a high-fashion editorial and music-video aesthetic.\n\nFocus: Ultra-sharp focus on facial structure, hair texture, and reflective jewelry details.\n\nDetail: Highly realistic skin texture, natural imperfections, metallic reflections, and subtle fabric textures.\n\nColor Grading: Deep monochromatic green color grading with rich shadows and luminous highlights.\n\nMood: Intense, atmospheric, and stylish with a dramatic cinematic presence.\n\nImportant: The subject’s face must remain identical to the reference image with realistic skin texture and natural features. The image ratio should be portrait."
      }
    ]
  },
  {
    title: "Icy Blue Futuristic Halo",
    slug: "icy-blue-futuristic-halo",
    description: "Futuristic closet-up portrait with a neon halo effect and cool monochromatic icy blue lighting.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_vgqpw8vgqpw8vgqp.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_24e81424e81424e8.png`
    ],
    author: "Gemini",
    sections: [
      {
        label: "ROLE & AESTHETIC",
        content: "You are a world-class editorial portrait photographer specializing in minimalist futuristic studio imagery and dramatic monochromatic lighting. Your task is to create a cinematic portrait with a clean, modern aesthetic that emphasizes geometric lighting, cool tones, and strong visual contrast."
      },
      {
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)",
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\n\nPreservation: The subject’s facial features must remain identical to the uploaded image. Maintain the exact facial structure, skin texture, hairstyle, and natural likeness without modification.\n\nUniversal Application: Apply all lighting, styling, and compositional instructions while preserving the subject’s identity regardless of gender."
      },
      {
        label: "WARDROBE & STYLING",
        content: "Attire: Dark minimalist clothing such as a black turtleneck or similar structured garment.\n\nTexture: Matte fabric surfaces that absorb light and contrast with reflective elements.\n\nFit: Clean, modern, and tailored to maintain a refined editorial silhouette.\n\nAccessories: Metallic accessories and reflective sunglasses that capture ambient light and subtle reflections from the surrounding illumination.\n\nExpression: Calm, composed, and confident with a subtle futuristic mood."
      },
      {
        label: "SCENE & COMPOSITION",
        content: "Framing: A close-up portrait framed from the shoulders upward, keeping the focus on the face and upper silhouette.\n\nCamera Angle: Three-quarter profile orientation, allowing the contours of the face and jawline to be clearly defined.\n\nPose: The subject faces slightly away from the camera while maintaining a poised and balanced posture.\n\nBackground: A deep black background (approximately HEX #020509) that isolates the subject and enhances the glow of the neon light source.\n\nComposition Mood: Minimalist, futuristic, and visually striking with strong geometric balance."
      },
      {
        label: "LIGHTING (FUTURISTIC & MONOCHROMATIC)",
        content: "Palette: Dominated by cool icy-blue tones around approximately 6500K.\n\nKey Light: Soft directional studio light illuminating the face with controlled highlights and subtle shadow gradients.\n\nBack Light: A circular neon light positioned directly behind the subject creates a luminous halo effect.\n\nRim Lighting: The neon ring produces precise rim highlights along the head, hair edges, and shoulders.\n\nLight Interaction: The cool cyan glow reflects gently off metallic accessories and sunglasses while creating soft gradients across matte clothing textures."
      },
      {
        label: "TECHNICAL QUALITY",
        content: "Style: Hyper-realistic cinematic studio portrait photography with a futuristic editorial aesthetic.\n\nFocus: Ultra-sharp focus on facial features, reflective surfaces, and rim-lit edges.\n\nDetail: Realistic skin texture, subtle reflections, and smooth tonal transitions across the monochromatic lighting.\n\nAtmosphere: Clean, minimal studio environment emphasizing light geometry and contrast.\n\nImportant: The subject's face must remain unchanged with natural features and realistic skin texture. The image ratio should be portrait."
      }
    ]
  },
  {
    title: "Minimalist Studio Suit Portrait",
    slug: "minimalist-studio-suit",
    description: "Artistic black and white portrait in a minimalist fashion studio with sharp tailored suit lines.",
    images: [
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_v0rvz9v0rvz9v0rv.png`,
      `${CLOUDINARY_BASE_URL}Gemini_Generated_Image_tuqosttuqosttuqo.png`
    ],
    author: "Gemini",
    sections: [
      {
        label: "ROLE & AESTHETIC",
        content: "You are a world-class editorial portrait photographer specializing in minimalist fashion studio photography and timeless monochrome imagery. Your task is to create a refined black-and-white cinematic portrait with a clean, elegant composition and a powerful editorial presence."
      },
      {
        label: "IDENTITY ANCHOR (CRITICAL STRICT CONSTRAINT)",
        content: "Source: Use the person from the ATTACHED REFERENCE PHOTO.\n\nPreservation: The subject’s facial features must remain identical to the uploaded image. Maintain the exact facial structure, skin texture, hairstyle, and natural likeness without alteration.\n\nUniversal Application: Apply all styling, lighting, and compositional instructions while preserving the subject’s identity regardless of gender."
      },
      {
        label: "WARDROBE & STYLING",
        content: "Attire: A tailored dark suit with sharp, structured lines that create a polished and sophisticated silhouette.\n\nTexture: High-quality fabric with subtle texture visible in the jacket and trousers.\n\nFootwear: Polished black shoes that complement the formal styling.\n\nFit: Clean, structured tailoring that enhances the subject’s posture and editorial appearance.\n\nExpression: Calm, introspective, and confident, conveying quiet strength and elegance."
      },
      {
        label: "SCENE & COMPOSITION",
        content: "Framing: A cinematic portrait composition showing the seated subject with balanced negative space.\n\nPose: The subject sits on a simple modern chair, leaning slightly forward with hands clasped together, creating a thoughtful and composed posture.\n\nCamera Perspective: Natural eye-level framing that emphasizes the subject’s presence and body language.\n\nBackground: A plain, smooth gray studio backdrop that remains minimal and unobtrusive, keeping the visual focus entirely on the subject.\n\nComposition Mood: Minimalist, refined, and editorial, emphasizing elegance and clarity."
      },
      {
        label: "LIGHTING (CLEAN & SCULPTURAL)",
        content: "Palette: Classic monochrome black-and-white tonal range with strong contrast and smooth grayscale transitions.\n\nKey Light: Soft studio lighting carefully positioned to sculpt the facial structure and body contours.\n\nShadow Behavior: Controlled shadows create depth while maintaining a balanced tonal range across the face and clothing.\n\nLight Interaction: Highlights subtly reveal fabric textures, facial features, and the clean lines of the suit."
      },
      {
        label: "TECHNICAL QUALITY",
        content: "Style: High-end cinematic editorial portrait photography presented in black and white.\n\nFocus: Sharp focus on the subject with refined detail in facial texture, clothing fabric, and polished surfaces.\n\nContrast: High-contrast black-and-white grading that emphasizes depth, elegance, and timeless style.\n\nFormat: Vertical 4:5 crop suitable for editorial or fashion publication.\n\nMood: Refined, timeless, minimalist, and powerful.\n\nImportant: The subject's face must remain identical to the reference image with natural features and realistic skin texture."
      }
    ]
  }
];
