/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import ChatHistory from "../components/ChatHistory";
import { AIPsyTeam } from "../models/AIPsyTeam";
import SkillsetDisplayTable from "../components/SkillsetDisplayTable/SkillsetDisplayTable.tsx"
import { ISkill } from "../types/ISkill.ts";

function Chat() {

    /*const techLeadPrompt = "Tech Lead in a the company's department dealing with the frontend of a social media plateform"
    const dataScientistPrompt = "Data Scientist in charge of analyzing NASDAQ trends"
    const walmartCashierPrompt = "Walmart Cashier"*/
    const hotelRepectionistPrompt = "Hotel Receptionist in a luxury hotel"

    // memo : when trying to retrieve async value, need useState + useEffect
    const [jobDisambiguation, setJobDisambiguation] = useState("")
    const [requiredSkillset, setRequiredSkillset] = useState("")
    useEffect(() => {
        async function fetchJobDisambiguation () {
            try {
                const jobExtractorResult = await AIPsyTeam.jobExtractorAgent.enableParsabilityCheck()
                    .setRequest(hotelRepectionistPrompt)
                    .call()
                console.log(jobExtractorResult)
                setJobDisambiguation(JSON.parse(jobExtractorResult).jobTitle)

                const skillsetGeneratorResult = await AIPsyTeam.requiredSkillsetGeneratorAgent.enableParsabilityCheck()
                    .setRequest(await JSON.parse(jobExtractorResult).jobTitle)
                    .call()
                console.log(skillsetGeneratorResult)
                setRequiredSkillset(skillsetGeneratorResult)
            } catch (error) {
                console.error("Error fetching job disambiguation:", error)
            }
        }
        fetchJobDisambiguation()
    }, [])
    // <SkillsetDisplayTable skillset={JSON.parse(requiredSkillset)}/>
    return (
        <>
            {jobDisambiguation}<br/>
            {requiredSkillset}
            <SkillsetDisplayTable skillset={requiredSkillset == "" ? [] : JSON.parse(requiredSkillset)}/>
            <ChatHistory/>
        </>
      );
}
  
  export default Chat