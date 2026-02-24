
-- Add negative_prompt and consistency_suffix columns to image_styles
ALTER TABLE image_styles 
  ADD COLUMN IF NOT EXISTS negative_prompt text DEFAULT '',
  ADD COLUMN IF NOT EXISTS consistency_suffix text DEFAULT 'Consistent character design across all panels.';

-- Populate all 10 styles
UPDATE image_styles SET negative_prompt = '3D render, 3D animation, Pixar style, CGI, smooth plastic skin, ray tracing, photorealistic, hyperrealistic, Unreal Engine, octane render', consistency_suffix = 'Consistent character design across all panels. Same ink line weight, same cel-shaded coloring style.' WHERE style_key = 'graphic_novel';

UPDATE image_styles SET negative_prompt = 'harsh lines, dark shadows, photorealistic, 3D render, neon colors, pixel art, anime style', consistency_suffix = 'Consistent character design across all panels. Same soft brush strokes, same pastel warmth.' WHERE style_key = 'storybook_soft';

UPDATE image_styles SET negative_prompt = 'muted colors, photorealistic, 3D render, dark atmosphere, horror, gritty, washed out', consistency_suffix = 'Consistent character design across all panels. Same vibrant palette, same bold outlines.' WHERE style_key = 'storybook_vibrant';

UPDATE image_styles SET negative_prompt = 'photorealistic, oil painting, watercolor, 3D render, Pixar, CGI, western cartoon style', consistency_suffix = 'Consistent character design across all panels. Same anime proportions, same eye style, same line art.' WHERE style_key = 'manga_anime';

UPDATE image_styles SET negative_prompt = 'photorealistic, dark, gritty, horror, muted colors, 3D render, Pixar, oil painting', consistency_suffix = 'Consistent character design across all panels. Same cartoon proportions, same bold colors.' WHERE style_key = 'adventure_cartoon';

UPDATE image_styles SET negative_prompt = 'full cartoon, flat colors, pixel art, anime, cel-shaded, abstract, sketch', consistency_suffix = 'Consistent character design across all panels. Same level of realism, same lighting style.' WHERE style_key = 'semi_realistic';

UPDATE image_styles SET negative_prompt = 'flat 2D, hand-drawn, sketch, watercolor, pixel art, photorealistic photo, live action', consistency_suffix = 'Consistent character design across all panels. Same 3D model style, same material textures, same lighting.' WHERE style_key = '3d_adventure';

UPDATE image_styles SET negative_prompt = 'photorealistic, 3D render, smooth gradients, watercolor, oil painting, high resolution photo', consistency_suffix = 'Consistent character design across all panels. Same pixel density, same color palette, same sprite proportions.' WHERE style_key = 'pixel_art';

UPDATE image_styles SET negative_prompt = 'photorealistic, smooth surfaces, watercolor, anime, sketch, dark atmosphere', consistency_suffix = 'Consistent character design across all panels. Same blocky proportions, same plastic-like material look.' WHERE style_key = 'brick_block';

UPDATE image_styles SET negative_prompt = 'modern digital art, 3D render, neon colors, pixel art, anime, photorealistic, HDR', consistency_suffix = 'Consistent character design across all panels. Same retro grain, same muted color palette, same vintage illustration style.' WHERE style_key = 'vintage_retro';
