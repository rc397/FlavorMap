from fastapi import FastAPI
from pydantic import BaseModel
import random

app = FastAPI()

# 1. Simple In-Memory Database for User History
# In a real app, this would be a database like PostgreSQL or Redis
user_history = {}

# 2. Foodfinity's expanded vocabulary (your phrases)
phrases = [
    "Great choice!",
    "That sounds absolutely delicious!",
    "What a fantastic, flavorful selection!",
    "Wow! You have a good taste.",
    "Good food, good mood—enjoy!",
    "That's a smart and savory choice.",
    "Enjoy every bite of that {food}!",
    "Savor the flavor.",
    "That looks like a perfect blend of nutrients and taste.",
    "A festival of flavors!"
]

descriptors = ["mouth-watering", "rich", "flavorful", "succulent", "crispy", "velvety"]

# 3. Emoji Mapping Engine
emoji_map = {
    "pizza": "🍕",
    "burger": "🍔",
    "sushi": "🍣",
    "taco": "🌮",
    "pasta": "🍝",
    "salad": "🥗",
    "coffee": "☕",
    "dessert": "🍰",
    "steak": "🥩",
    "default": "🍽️"
}

class SearchRequest(BaseModel):
    user_id: str
    food_item: str

@app.post("/foodfinity/suggest")
async def suggest_food(request: SearchRequest):
    user_id = request.user_id
    food = request.food_item.lower()

    # --- PART 1: Generate the Response ---
    base_phrase = random.choice(phrases).replace("{food}", food)
    word = random.choice(descriptors)
    
    # Get matching emoji or default
    emoji = emoji_map.get(food, emoji_map["default"])
    
    current_response = f"{base_phrase} It looks so {word}! {emoji}"

    # --- PART 2: Handle User History ---
    history_msg = ""
    if user_id in user_history:
        last_food = user_history[user_id][-1]
        history_msg = f" (Better than the {last_food} you looked at earlier! 😉)"
        user_history[user_id].append(food)
    else:
        user_history[user_id] = [food]

    return {
        "bot_name": "Foodfinity",
        "message": current_response + history_msg,
        "history_count": len(user_history[user_id])
    }

