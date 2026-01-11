
import os
import google.generativeai as genai
from openai import AsyncOpenAI
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
            
        if self.openai_enabled:
            # Use async client for non-blocking streaming
            self.openai_client = AsyncOpenAI(api_key=openai_key)

    async def get_response(self, prompt: str, model_type: str = "gemini", thinking_mode: bool = False):
        try:
            # Extreme conciseness
            system_instr = "You are Lumina AI. Answer in a human-like, extremely brief manner. Max 1-2 paragraphs. Be very direct. No long lists."
            
            if thinking_mode:
                full_prompt = f"{system_instr} Provide your reasoning in a <thinking> block and your actual response after it.\n\nUser: {prompt}"
            else:
                full_prompt = f"{system_instr}\n\nUser: {prompt}"

            if model_type == "gemini" and self.gemini_enabled:
                response = await self.gemini_model.generate_content_async(full_prompt)
                if not response.parts:
                    return {"response": "The AI response was blocked by safety filters.", "thinking": None}
                return self._parse_thinking(response.text)
            
            elif model_type == "openai" and self.openai_enabled:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": full_prompt}]
                )
                return self._parse_thinking(response.choices[0].message.content)
            
            return {"response": "AI model or key unavailable.", "thinking": None}
            
        except Exception as e:
            print(f"AI Service Error: {str(e)}")
            return {"response": f"Error: {str(e)}", "thinking": None}

    async def stream_response(self, prompt: str, model_type: str = "gemini", thinking_mode: bool = False):
        try:
            # Extreme conciseness for streaming
            system_instr = "You are Lumina AI. Be extremely concise. Give a brief summary (max 3-5 sentences). No encyclopedic info. No lists."
            if thinking_mode:
                full_prompt = f"{system_instr} Put step-by-step reasoning in a <thinking> block, then your final brief answer.\n\nUser: {prompt}"
            else:
                full_prompt = f"{system_instr}\n\nUser: {prompt}"

            if model_type == "gemini" and self.gemini_enabled:
                response = await self.gemini_model.generate_content_async(full_prompt, stream=True)
                async for chunk in response:
                    if chunk.text:
                        yield chunk.text
            
            elif model_type == "openai" and self.openai_enabled:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": full_prompt}],
                    stream=True
                )
                async for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            else:
                yield "AI model unavailable."
                
        except Exception as e:
            print(f"AI Stream Error: {str(e)}")
            yield f"Error in stream: {str(e)}"

    def _parse_thinking(self, text: str):
        import re
        thinking = None
        response_text = text
        
        match = re.search(r'<thinking>(.*?)</thinking>', text, re.DOTALL)
        if match:
            thinking = match.group(1).strip()
            response_text = re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.DOTALL).strip()
            
        return {"response": response_text, "thinking": thinking}

ai_service = AIService()
