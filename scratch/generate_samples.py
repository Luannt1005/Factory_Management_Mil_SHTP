import os
from PIL import Image, ImageDraw, ImageFont

# Define departments and their gradient colors
depts = [
    {
        "filename": "management.png",
        "title": "Management",
        "colors": [(102, 51, 153), (255, 105, 180)] # Purple to HotPink
    },
    {
        "filename": "scm.png",
        "title": "SCM",
        "colors": [(30, 144, 255), (0, 206, 209)] # DodgerBlue to DarkCyan
    },
    {
        "filename": "opm.png",
        "title": "OPM",
        "colors": [(46, 139, 87), (218, 165, 32)] # SeaGreen to Goldenrod
    },
    {
        "filename": "engineering.png",
        "title": "Engineering",
        "colors": [(75, 0, 130), (138, 43, 226)] # Indigo to BlueViolet
    },
    {
        "filename": "ee_mt.png",
        "title": "EE / MT",
        "colors": [(255, 140, 0), (220, 20, 60)] # DarkOrange to Crimson
    },
    {
        "filename": "ie_fmu_mif.png",
        "title": "IE / FMU / MIF",
        "colors": [(0, 191, 255), (0, 0, 128)] # DeepSkyBlue to Navy
    },
    {
        "filename": "ame_auto_opex.png",
        "title": "AME / Auto / Opex",
        "colors": [(219, 112, 147), (75, 0, 130)] # PaleVioletRed to Indigo
    },
    {
        "filename": "manufacturing.png",
        "title": "Manufacturing",
        "colors": [(255, 69, 0), (128, 0, 0)] # OrangeRed to Maroon
    },
    {
        "filename": "quality.png",
        "title": "Quality",
        "colors": [(34, 139, 34), (0, 128, 128)] # ForestGreen to Teal
    },
    {
        "filename": "ehs_esg.png",
        "title": "EHS / ESG",
        "colors": [(0, 100, 80), (154, 205, 50)] # DarkGreen to YellowGreen
    }
]

output_dir = "public/landing_page"
os.makedirs(output_dir, exist_ok=True)

width, height = 800, 500

for dept in depts:
    # Create gradient background
    image = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(image)
    
    color1 = dept["colors"][0]
    color2 = dept["colors"][1]
    
    # Draw linear gradient
    for y in range(height):
        # Interpolate color
        r = int(color1[0] + (color2[0] - color1[0]) * (y / height))
        g = int(color1[1] + (color2[1] - color1[1]) * (y / height))
        b = int(color1[2] + (color2[2] - color1[2]) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Draw overlay border or abstract circle
    draw.ellipse([width - 150, height - 150, width + 100, height + 100], fill=(255, 255, 255, 40))
    
    # Draw text in the center
    # Try to load a font, fallback if not available
    font = None
    try:
        font = ImageFont.truetype("arial.ttf", 60)
    except IOError:
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 60)
        except IOError:
            font = ImageFont.load_default()
            
    text = dept["title"]
    
    # Get text size
    if hasattr(font, 'getbbox'):
        bbox = font.getbbox(text)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    else:
        text_width, text_height = draw.textsize(text, font=font)
        
    x = (width - text_width) // 2
    y_pos = (height - text_height) // 2
    
    # Draw a clean semi-transparent box for text background
    draw.rectangle([x - 30, y_pos - 20, x + text_width + 30, y_pos + text_height + 20], fill=(0, 0, 0, 80))
    
    # Draw text
    draw.text((x, y_pos), text, fill=(255, 255, 255), font=font)
    
    # Save the image
    file_path = os.path.join(output_dir, dept["filename"])
    image.save(file_path, "PNG")
    print(f"Generated {file_path}")
