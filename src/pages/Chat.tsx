/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import ChatHistory from "../components/ChatHistory";
import { AIPsyTeam } from "../models/AIPsyTeam";
import SkillsetDisplayTable from "../components/SkillsetDisplayTable/SkillsetDisplayTable.tsx"
import { ChatService } from "../services/ChatService.ts";
import '../style/Chat.css'
import { OllamaService } from "../services/OllamaService.ts";
import { ISkill } from "../types/ISkill.ts";

function Chat() {

    const techLeadPrompt = "Tech Lead in a the company's department dealing with the frontend of a social media plateform"
    const dataScientistPrompt = "Data Scientist in charge of analyzing NASDAQ trends"
    const walmartCashierPrompt = "Walmart Cashier"
    const aerospaceEnginPrompt = "Aerospace Engineer"
    const hotelRepectionistPrompt = "Hotel Receptionist in a luxury hotel"

    const [jobDisambiguation, setJobDisambiguation] = useState<string>("")
    const [requiredSkillset, setRequiredSkillset] = useState<ISkill[]>([])
    const [questionsAssessingSkill, setQuestionsAssessingSkillResult] = useState<string[]>([])
    const [rankedQuestions, setRankedQuestions] = useState<string[]>([])
    const [modelsList, setModelsList] = useState<string[]>([])
    
    const [lastContext, setLastContext] = useState<number[]>([])

    const effectRef = useRef<number>(0);

    // memo : when trying to retrieve async value, need useState + useEffect
    useEffect(() => {
        async function fetchJobDisambiguation () {
            if(effectRef.current == 1) return
            if(effectRef.current == 0) effectRef.current = 1
            try {
                // listing all the models installed on the users machine
                const modelList = await OllamaService.getModelList()
                if(modelList != null) {
                    const ml = modelList?.models.map((model) => model?.model)
                    setModelsList(ml)
                }

                // generating a perfect job title
                const jobExtractorResult = await AIPsyTeam.jobExtractorAgent
                    .enableParsabilityCheck()
                    .setRequest(aerospaceEnginPrompt)
                    .call()
                const jobTitle = JSON.parse(jobExtractorResult).jobTitle
                setJobDisambiguation(jobTitle)

                // generating a skillset required for said job
                const skillsetGeneratorResult = await AIPsyTeam.requiredSkillsetGeneratorAgent
                    .enableParsabilityCheck()
                    .setRequest(jobTitle)
                    .call()
                const skillset = JSON.parse(skillsetGeneratorResult)
                setRequiredSkillset(skillset)

                // generating a list of question to assess one skill
                const questionsAssessingSkillResult = await AIPsyTeam.skillToQuestionsTranslatorAgent
                    .setRequest(`Here is the specified position :\n
                    ${jobTitle}\n\n
                    Here is THE ONE AND ONLY targeted skill your questions should assess :\n
                    ${skillset[0]}`)
                    .call()
                setQuestionsAssessingSkillResult(JSON.parse(questionsAssessingSkillResult))

                // reranking the previous list of questions
                const rankedQuestionsResult = await AIPsyTeam.skillAssessmentQuestionsRankingAgent
                    .setRequest(`Here is a javascript array containing the list of questions :\n
                    ${questionsAssessingSkill}\n\n
                    Here is the targeted skill assessed by those questions :\n
                    ${skillset[0]}`)
                    .call()
                setRankedQuestions(JSON.parse(rankedQuestionsResult))


            } catch (error) {
                console.error("Error fetching job disambiguation:", error)
            }
        }
        fetchJobDisambiguation()
    }, [])

    const textareaRef = useRef(null);
    const [history, setHistory] = useState<string[]>([])
    const recentHistory = useRef<string[]>([])

    async function handleSendMessage() : Promise<void>{
        if(textareaRef.current == null) return
        const historyCopy = [...history]
        const response = await ChatService.askQuestion((textareaRef.current as HTMLTextAreaElement).value, lastContext)
        historyCopy.push(response.response)
        setHistory(historyCopy)
        setLastContext(response.context);
        (textareaRef.current as HTMLTextAreaElement).value=''
    }

    async function handleSendMessageStreaming() : Promise<string | void>{
        if(textareaRef.current == null) return
        const historyCopy = [...history]
        historyCopy.push((textareaRef.current as HTMLTextAreaElement).value)
        historyCopy.push("")
        recentHistory.current = historyCopy
        setHistory(historyCopy)
        const reader : ReadableStreamDefaultReader<Uint8Array> = await ChatService.askQuestionStreaming((textareaRef.current as HTMLTextAreaElement).value, lastContext)
        let content = ""
        while(true){
            const { done, value } = await reader.read()
            if (done) {
                break;
            }

            const stringifiedJson = new TextDecoder().decode(value);
            const json = JSON.parse(stringifiedJson)

            if(json.done && json?.context) setLastContext(json.context)
        
            if (!json.done) {
                content += json.response
                if(json?.context?.length > 0) console.log("falsedone : " + json?.context)
                const newHistory = [...recentHistory.current]
                newHistory[newHistory.length-1] = content
                recentHistory.current = newHistory
                setHistory(newHistory);
                (textareaRef.current as HTMLTextAreaElement).value=''
            }
        }
        return content
    }

    return (
        <>
            <select style={{maxWidth:'300px', height: '2rem'}}>
                {modelsList.map((model,id) => <option key={id}>{model}</option>)}
            </select>
            {jobDisambiguation}<br/>
            <SkillsetDisplayTable skillset={requiredSkillset}/><br/><br/>
            {questionsAssessingSkill.map((question, index) =>
                {
                    return(<div key={'quest'+index} style={{textAlign:'left', padding:'0.25rem 2rem', backgroundColor:index%2 == 0 ? '#fff' : '#eee'}}>- {question}</div>)
                })
            }<br/><br/>
            {rankedQuestions.map((question, index) =>
                {
                    return(<div key={'rankedQuest'+index} style={{textAlign:'left', padding:'0.25rem 2rem', backgroundColor:index%2 == 0 ? '#fff' : '#eee'}}>{index+1}  -  {question}</div>)
                })
            }
            <ChatHistory/>
            {
                history.map((message, index) => <div style={{backgroundColor:index%2 == 0 ? '#fff' : '#eee'}} key={'message' + index}>{message}</div>)
            }
            <textarea ref={textareaRef} style={{margin:'2rem 0', resize:'none', height:'300px'}}></textarea>
            <button onClick={handleSendMessageStreaming}>send</button>
        </>
      );
}
  
// lorsque je vois certains elements textuels, par exemple : bulletpoint list. je peux extraire toute la partie de la phrase relative a cette
// instruction utilisateur grace au llm et la remplacer par quelque chose de plus effectif

  export default Chat