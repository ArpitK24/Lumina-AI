import os
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        self.gemini_enabled = bool(gemini_key)
        self.openai_enabled = bool(openai_key)
        
        if self.gemini_enabled:
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
            
        if self.openai_enabled:
            self.openai_client = OpenAI(api_key=openai_key)

    async def get_response(self, prompt: str, model_type: str = "gemini", thinking_mode: bool = False):
        if thinking_mode:
            # Add a specific instruction for "Thinking"
            full_prompt = f"System: Please think step by step before answering. Provide your reasoning in a <thinking> block and your actual response after it.\n\nUser: {prompt}"
        else:
            full_prompt = prompt

        if model_type == "gemini" and self.gemini_enabled:
            response = self.gemini_model.generate_content(full_prompt)
            return self._parse_thinking(response.text)
        
        elif model_type == "openai" and self.openai_enabled:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": full_prompt}]
            )
            return self._parse_thinking(response.choices[0].message.content)
        
        return {"response": "AI API key missing or model unavailable.", "thinking": None}

    def _parse_thinking(self, text: str):
        # Basic parsing of <thinking> blocks if present
        import re
        thinking = None
        response_text = text
        
        match = re.search(r'<thinking>(.*?)</thinking>', text, re.DOTALL)
        if match:
            thinking = match.group(1).strip()
            response_text = re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.DOTALL).strip()
            
        return {"response": response_text, "thinking": thinking}

ai_service = AIService()
