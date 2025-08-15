import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI( process.env.GOOGLE_AI_KEY);


 const generateResult = async (prompt) => {
  try {

     const model = ai.getGenerativeModel({
         model: "gemini-1.5-flash",
         systemInstruction:`You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices. You use understable comments in the code , you create files as needed, you write code while maintaining the working of previous code . You always follow the best practices of the development .You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions`
         });
     const result = await model.generateContent(prompt);
     return result.response.text();

    
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, I couldn't process your request.---";
  }
};

export default generateResult;

