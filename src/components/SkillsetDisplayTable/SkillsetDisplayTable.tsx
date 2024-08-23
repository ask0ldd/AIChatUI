import { ISkill } from '../../types/ISkill'
import SkillsetDisplayRow from './SkillsetDisplayRow'
import './SkillsetDisplayTable.css'

function SkillsetDisplayTable({skillset} : {skillset : ISkill[]}) {
  return (
    <table>
        <thead>
            <tr>
                <th className='skill'>Id</th><th>Skill</th><th>Description</th>
            </tr>
        </thead>
        <tbody>
          {
            skillset.map((skill, index) => <SkillsetDisplayRow key={'row'+index} skill={{...skill, id : index+1}}/>)
          }
        </tbody>
    </table>
  )
}

export default SkillsetDisplayTable