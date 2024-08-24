/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import ChatHistory from "../components/ChatHistory";
import { AIPsyTeam } from "../models/AIPsyTeam";
import SkillsetDisplayTable from "../components/SkillsetDisplayTable/SkillsetDisplayTable.tsx"
import { ISkill } from "../types/ISkill.ts";
import { ChatService } from "../services/ChatService.ts";
import '../style/Chat.css'
import { OllamaService } from "../services/OllamaService.ts";
import { IListModelResponse } from "../types/IListModelResponse.ts";

function Chat() {

    const techLeadPrompt = "Tech Lead in a the company's department dealing with the frontend of a social media plateform"
    const dataScientistPrompt = "Data Scientist in charge of analyzing NASDAQ trends"
    const walmartCashierPrompt = "Walmart Cashier"
    const aerospaceEnginPrompt = "Aerospace Engineer"
    const hotelRepectionistPrompt = "Hotel Receptionist in a luxury hotel"

    // memo : when trying to retrieve async value, need useState + useEffect
    const [jobDisambiguation, setJobDisambiguation] = useState("")
    const [requiredSkillset, setRequiredSkillset] = useState([])
    const [questionsAssessingSkill, setQuestionsAssessingSkillResult] = useState([])
    const [rankedQuestions, setRankedQuestions] = useState([])
    const [modelsList, setModelsList] = useState<string[]>([])
    
    const [lastContext, setLastContext] = useState<number[]>([])

    const effectRef = useRef(0)

    useEffect(() => {
        async function fetchJobDisambiguation () {
            if(effectRef.current == 1) return
            if(effectRef.current == 0) effectRef.current = 1
            try {
                // generate perfect job title
                const modelList = await OllamaService.getModelList()
                if(modelList != null) {
                    const ml = modelList?.models.map((model) => model?.model)
                    setModelsList(ml)
                }
                // console.log('modelList : ' + JSON.stringify(modelList))

                const jobExtractorResult = await AIPsyTeam.jobExtractorAgent.enableParsabilityCheck()
                    .setRequest(aerospaceEnginPrompt)
                    .call()
                const jobTitle = JSON.parse(jobExtractorResult).jobTitle
                setJobDisambiguation(jobTitle)

                // generate a skillset required for said job
                const skillsetGeneratorResult = await AIPsyTeam.requiredSkillsetGeneratorAgent.enableParsabilityCheck()
                    .setRequest(jobTitle)
                    .call()
                const skillset = JSON.parse(skillsetGeneratorResult)
                setRequiredSkillset(skillset)

                // generate a list of question to assess one skill
                const questionsAssessingSkillResult = await AIPsyTeam.skillToQuestionsTranslatorAgent
                    .setRequest(`Here is the specified position :\n
                    ${jobTitle}\n\n
                    Here is THE ONE AND ONLY targeted skill your questions should assess :\n
                    ${skillset[0]}`)
                    .call()
                setQuestionsAssessingSkillResult(JSON.parse(questionsAssessingSkillResult))

                // ranking the list of question
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
    // <SkillsetDisplayTable skillset={JSON.parse(requiredSkillset)}/>

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
        historyCopy.push("")
        recentHistory.current = historyCopy
        setHistory(historyCopy)
        const reader : ReadableStreamDefaultReader<Uint8Array> = await ChatService.askQuestionStreaming((textareaRef.current as HTMLTextAreaElement).value, lastContext)
        let content = ""
        while(true){
            const { done, value } = await reader.read()
            if (done) {
                /*const rawjson = new TextDecoder().decode(value);
                console.log(rawjson)
                const json = JSON.parse(rawjson)
                setLastContext(json.context)*/
                break;
            }
            const rawjson = new TextDecoder().decode(value);
            // console.log(rawjson)
            const json = JSON.parse(rawjson)
        
            if (json.done === false) {
                content += json.response
                if(json?.context?.length > 0) setLastContext(json.context)
                const newHistory = [...recentHistory.current]
                newHistory[newHistory.length-1] = content
                recentHistory.current = newHistory
                setHistory(newHistory)
            }
        }
        return content
        /*historyCopy.push(response.response)
        setHistory(historyCopy)
        setLastContext(response.context);
        (textareaRef.current as HTMLTextAreaElement).value=''*/
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