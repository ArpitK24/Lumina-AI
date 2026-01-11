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
            try:
                # Use the latest major version found in diagnostics (Gemini 2.5 Flash)
                self.gemini_model = genai.GenerativeModel("gemini-2.5-flash")
                print("Gemini 2.5 Flash initialized")
            except Exception as e:
                print(f"Warning: Failed to init gemini-2.5-flash: {e}")
                # Fallback to the generic 'latest' identifier
                self.gemini_model = genai.GenerativeModel("gemini-flash-latest")
                print("Fallback to Gemini Flash Latest initialized")

    async def get_response(self, prompt: str, model_type: str = "gemini", thinking_mode: bool = False):
        try:
            if thinking_mode:
                full_prompt = f"System: Please think step by step before answering. Provide your reasoning in a <thinking> block and your actual response after it.\n\nUser: {prompt}"
            else:
                full_prompt = prompt

            if model_type == "gemini" and self.gemini_enabled:
                print(f"Calling Gemini with prompt length: {len(full_prompt)}")
                # Use the generative model to get a response asynchronously
                response = await self.gemini_model.generate_content_async(full_prompt)
                
                # Check for empty response or blocked content
                if not response.parts:
                    return {"response": "The AI response was blocked by safety filters or is empty.", "thinking": None}
                
                return self._parse_thinking(response.text)
            
            elif model_type == "openai" and self.openai_enabled:
                print(f"Calling OpenAI with prompt length: {len(full_prompt)}")
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": full_prompt}]
                )
                return self._parse_thinking(response.choices[0].message.content)
            
            elif model_type == "openai" and not self.openai_enabled:
                return {"response": "GPT-4 (OpenAI) is not configured. Please add your API key to use this model or switch to Gemini.", "thinking": None}
            
            return {"response": "AI API key missing or model unavailable. Please check your .env file.", "thinking": None}
            
        except Exception as e:
            print(f"AI Service Error: {str(e)}")
            return {"response": f"I encountered an error while processing your request: {str(e)}", "thinking": None}

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
