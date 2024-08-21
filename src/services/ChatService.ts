export class ChatService{
    static async askQuestion(question : string) : Promise<unknown>{
        try {
            const response = await fetch('http://localhost:3000/chat',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"question" : question})      
            })
            if(response.status != 200) throw new Error("Can't get a reply to your question.")
            return response
        }catch(error){
            console.error(error)
        }
    }
}