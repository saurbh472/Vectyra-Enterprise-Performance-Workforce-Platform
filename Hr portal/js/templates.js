// ═══════════════════════════════════════════════
// QUESTION TEMPLATES SYSTEM (DYNAMIC FORM BUILDER)
// ═══════════════════════════════════════════════
const DEFAULT_QUESTION_TEMPLATES = {
  peer: {
    metrics: [
      { id: 'quality_of_work', label: 'Quality of Work' },
      { id: 'work_consistency', label: 'Work Consistency' },
      { id: 'work_knowledge', label: 'Work Knowledge and Competence' },
      { id: 'communication', label: 'Communication' },
      { id: 'independent_work', label: 'Independent Work' },
      { id: 'initiative_taker', label: 'Initiative Taker' },
      { id: 'productivity', label: 'Productivity' },
      { id: 'interpersonal_relations', label: 'Interpersonal Relations' },
      { id: 'technical_skills', label: 'Technical Skills' },
      { id: 'timeliness', label: 'Timeliness for Assigned Tasks' }
    ],
    questions: [
      { id: 'q_team_discussion', question: 'Does the employee contribute effectively to team discussion and decision making?' },
      { id: 'q_respect_opinions', question: 'How far does the employee respect opinions and ideas of others within the team?' },
      { id: 'q_task_input', question: 'Any specific detail wherein task-related input has come up from the employee’s side resulting in overall task completion fairly?' },
      { id: 'q_creativity', question: 'Does the employee bring creativity in the assigned tasks and initiate for a particular task being accomplished in a distinguishing manner?' },
      { id: 'q_doubts_concerns', question: 'Does the employee bring up doubts and concerns related to the assigned task on his/her own or only when you ask for task related updates?' }
    ]
  },
  manager: {
    metrics: [
      { id: 'm_leadership', label: 'Leadership & Guidance' },
      { id: 'm_support', label: 'Support & Mentorship' },
      { id: 'm_communication', label: 'Communication' },
      { id: 'm_availability', label: 'Availability for Discussion' },
      { id: 'm_delegation', label: 'Delegation of Responsibility' },
      { id: 'm_interpersonal', label: 'Interpersonal Relations' },
      { id: 'm_transparency', label: 'Transparency' },
      { id: 'm_flexibility', label: 'Flexibility' },
      { id: 'm_empathy', label: 'Empathy' }
    ],
    questions: [
      { id: 'mq_career_growth', question: 'Does your Manager help you grow professionally and provide opportunities for career development?' },
      { id: 'mq_constructive_fb', question: 'Does your Manager provide timely constructive feedback and recognise your contributions?' },
      { id: 'mq_respectful', question: 'How respectful and professional is your Manager in his interactions with you and the team?' },
      { id: 'mq_suggestions', question: 'What suggestions do you have for your Manager to improve their leadership or management style?' }
    ]
  },
  hr: {
    metrics: [
      { id: 'hr_approachability', label: 'Approachability' },
      { id: 'hr_responsiveness', label: 'Responsiveness' },
      { id: 'hr_empathy', label: 'Empathy' },
      { id: 'hr_fairness', label: 'Fairness' },
      { id: 'hr_professionalism', label: 'Professionalism' },
      { id: 'hr_conflict_handling', label: 'Conflict Handling' },
      { id: 'hr_confidentiality', label: 'Confidentiality' },
      { id: 'hr_learning_dev', label: 'Learning and Development Coordination' },
      { id: 'hr_perf_review', label: 'Performance Review Coordination' },
      { id: 'hr_engagement', label: 'Engagement Initiatives' },
      { id: 'hr_fb_regularization', label: 'Feedback Regularization' },
      { id: 'hr_communication', label: 'Communication (Clarity and Timely Announcements)' },
      { id: 'hr_hiring_coord', label: 'Hiring Coordination' },
      { id: 'hr_admin_support', label: 'Admin Activities Support' }
    ],
    questions: [
      { id: 'hrq_general_feedback', question: 'What key organizational or workplace culture improvements would you suggest to HR leadership?' },
      { id: 'hrq_support_satisfaction', question: 'How satisfied are you with HR responsiveness, conflict resolution, and employee support?' }
    ]
  },
  '360': {
    metrics: [
      { id: 'xf_quality_of_work', label: 'Quality of Work' },
      { id: 'xf_ownership_accountability', label: 'Ownership and Accountability' },
      { id: 'xf_work_knowledge', label: 'Work Knowledge and Competence' },
      { id: 'xf_collaboration_comm', label: 'Collaboration and Communication' },
      { id: 'xf_problem_solving', label: 'Problem Solving and Decision Making' },
      { id: 'xf_initiative_taker', label: 'Initiative Taker' },
      { id: 'xf_adaptability', label: 'Adaptability' },
      { id: 'xf_interpersonal_teamwork', label: 'Interpersonal Relations (Teamwork)' },
      { id: 'xf_technical_skills', label: 'Technical Skills' },
      { id: 'xf_leadership_qualities', label: 'Leadership Qualities' }
    ],
    questions: [
      { id: 'q360_cross_functional_impact', question: 'How effectively does this employee collaborate with cross-functional teams and deliver joint project goals?' },
      { id: 'q360_strengths_improvements', question: 'What are the top key strengths and areas of growth for this team member?' }
    ]
  },
  self: {
    metrics: [
      { id: 'self_quality_work', label: 'Quality of Work & Deliverables' },
      { id: 'self_ownership', label: 'Ownership & Accountability' },
      { id: 'self_work_knowledge', label: 'Work Knowledge & Competence' },
      { id: 'self_collaboration', label: 'Collaboration & Communication' },
      { id: 'self_problem_solving', label: 'Problem Solving & Decision Making' },
      { id: 'self_initiative', label: 'Initiative & Proactiveness' },
      { id: 'self_adaptability', label: 'Adaptability & Flexibility' },
      { id: 'self_interpersonal', label: 'Interpersonal Relations (Teamwork)' },
      { id: 'self_technical', label: 'Technical Skills & Expertise' },
      { id: 'self_goal_attainment', label: 'Goal & KRA Attainment for the Period' }
    ],
    questions: [
      { id: 'sq_accomplishments', question: 'What were your key accomplishments and contributions during this review period?' },
      { id: 'sq_kra_goals', question: 'How well did you achieve your defined KRAs and goals? Please provide specific examples.' },
      { id: 'sq_skills_learned', question: 'What new skills, knowledge, or competencies did you develop during this period?' },
      { id: 'sq_strengths', question: 'What do you consider your top 3 strengths that contributed most to your performance?' },
      { id: 'sq_improvements', question: 'What areas do you believe you need to improve or develop further in the coming period?' },
      { id: 'sq_challenges', question: 'What challenges or obstacles did you face, and how did you overcome them?' },
      { id: 'sq_dev_goals', question: 'What are your professional development goals and career aspirations for the next review period?' },
      { id: 'sq_support_needed', question: 'What support, resources, or opportunities do you need from your manager and the organisation to achieve your goals?' }
    ]
  },
  exit: {
    metrics: [
      { id: 'exit_management', label: 'Satisfaction with Management' },
      { id: 'exit_compensation', label: 'Satisfaction with Compensation' },
      { id: 'exit_workload', label: 'Workload & Burnout Balance' }
    ],
    questions: [
      { id: 'exq_reason', question: 'What is the primary reason for your departure?' },
      { id: 'exq_advice', question: 'What advice would you give to improve the organization?' }
    ]
  }
};

function getTemplates() {
  const saved = localStorage.getItem('PC_QUESTION_TEMPLATES');
  if (saved) {
    try { return JSON.parse(saved); } catch(e){}
  }
  return DEFAULT_QUESTION_TEMPLATES;
}

function saveTemplates(tpls) {
  localStorage.setItem('PC_QUESTION_TEMPLATES', JSON.stringify(tpls));
  toast('✅ Form Templates updated & published!', 'success');
}
