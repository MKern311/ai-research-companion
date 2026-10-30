/* AI in the Research Process – content data (phases, use cases, tools, technology assessment) */
const RISK = {1:'Low risk',2:'Medium risk',3:'High risk'};
const RISK_DEF = {1:'Public or your own non-sensitive material; errors are easy to spot.',2:'Unpublished work, third-party content or errors that propagate into results.',3:'Personal or sensitive data, or integrity-critical decisions.'};
const MODE_DEF = {'Assist':'You lead; AI provides suggestions on request.','Co-create':'You and AI develop the result iteratively together.','Delegate':'AI carries out a sub-task; you check the result at defined points.'};

const U = (t,d,cap,pot,risk,mode)=>({t,d,cap,pot,risk,mode});
const PHASES = [
 {id:'idee', name:'Ideation & Research Question', short:'Idea & Question',
  q:'Which relevant, open question is worth investigating?',
  goal:'Identify a research gap and formulate a precise, answerable research question.',
  tasks:['Scope the research field','Check relevance and novelty','Formulate the research question and objectives','Derive hypotheses or propositions'],
  uc:[
   U('Topic and trend scouting','Analyse publication and citation data to reveal growing topics, clusters and under-researched intersections.',['recherche','analyse'],2,1,'Assist'),
   U('Sparring partner for research questions','Turn rough ideas into alternative research questions, surface assumptions, and generate counter-positions and objections.',['generierung'],3,1,'Co-create'),
   U('Structured operationalisation','Structure questions with established frameworks (e.g. PICO, SPIDER, PEO) and sharpen the constructs.',['generierung','synthese'],2,1,'Co-create'),
   U('Novelty check','Semantic search for closely related work to spot duplication early and sharpen your positioning.',['recherche'],3,2,'Assist'),
   U('Interdisciplinary bridges','Suggest concepts and methods from neighbouring disciplines that transfer to your research question.',['generierung','recherche'],2,2,'Co-create')
  ],
  limits:['Apparent “gaps” may simply be gaps in the model’s knowledge – always verify against subject databases.','Popularity bias: models reinforce established mainstream topics.','Judging originality and relevance remains your task – and your supervisor’s.'],
  disc:['Where do you get stuck most when narrowing down a topic?','Under what conditions would you trust an AI-generated research question?']},
 {id:'literatur', name:'Literature Search & Review', short:'Literature',
  q:'What do we already know – and how robust is it?',
  goal:'Find, understand, appraise and synthesise relevant literature into a state of the art.',
  tasks:['Develop a search strategy','Search subject databases','Read and understand key papers','Screen, extract and appraise','Synthesise findings'],
  uc:[
   U('Search string development','Draft and iteratively refine Boolean search strings, including synonyms and subject headings, for bibliographic databases.',['generierung'],3,1,'Co-create'),
   U('Semantic search & citation networks','Search by meaning rather than keywords and follow forward and backward citations to find key works.',['recherche'],3,1,'Assist'),
   U('AI-assisted screening','Prioritise results by relevance (active learning) and suggest inclusion/exclusion decisions; you make the final call.',['analyse','agentisch'],3,2,'Delegate'),
   U('Data extraction into evidence tables','Transfer sample, method, variables and effects from full texts into structured tables – with a second, independent check.',['analyse'],3,2,'Co-create'),
   U('Querying your own PDF corpus','Make your literature library searchable and get answers with verified source passages (retrieval-augmented).',['recherche','synthese'],3,2,'Assist'),
   U('Synthesis & concept matrix','Compare findings across studies, flag contradictions and draft a concept matrix.',['synthese'],2,3,'Co-create'),
   U('Understanding difficult papers & methods','Have concepts, methods, notation or statistics explained in plain language, ask follow-up questions – and check against the original.',['synthese','generierung'],3,2,'Assist'),
   U('Reading non-English literature','Translate and summarise sources in other languages to judge their relevance; quote only from verified translations.',['generierung','synthese'],2,2,'Assist')
  ],
  limits:['Fabricated or misattributed references – verify every source.','Uploading papers: publisher licences and your library’s guidance decide what may be shared with AI tools.','Coverage gaps: paywalled content and non-English literature are often missing.','Systematic reviews require reproducible decisions (e.g. PRISMA) – document every AI step.'],
  disc:['Which review step takes you the most time?','How would you document AI steps so that your review stays reproducible?']},
 {id:'design', name:'Research Design & Methodology', short:'Design & Methods',
  q:'How do we answer the question validly and ethically?',
  goal:'Develop a robust design with a suitable method, sample and instruments, plus ethics approval and a data management plan.',
  tasks:['Choose method and design','Develop instruments (questionnaire, interview guide, protocol)','Plan the sample','Ethics approval and data management plan','Pre-registration where relevant'],
  uc:[
   U('Methods advice','Compare design alternatives with their pros and cons and work systematically through threats to validity.',['generierung','synthese'],2,2,'Co-create'),
   U('Instrument development','Draft items, interview guides and response scales; check for clarity and for double-barrelled or leading questions.',['generierung'],3,2,'Co-create'),
   U('Pre-testing with synthetic personas','Test instruments with simulated respondents for comprehension issues – as a supplement to real pre-tests, never a replacement.',['generierung','analyse'],2,3,'Assist'),
   U('Sample size & power analysis','Generate calculations as traceable code (e.g. R or Python) and make assumptions explicit.',['analyse'],2,2,'Assist'),
   U('Ethics application & data management plan','Structure drafts along your institution’s templates – the study-specific reasoning on consent, risks and anonymisation must be your own.',['generierung'],3,2,'Co-create')
  ],
  limits:['Synthetic “respondents” do not validly represent real populations.','Methodological responsibility and disciplinary conventions rest with you and your supervisory team.','Ethics committees expect study-specific reflection – generic AI text on consent or anonymisation can be wrong.'],
  disc:['Where could AI measurably improve the quality of your instruments?','What role should synthetic data be allowed to play in your research?']},
 {id:'foerderung', name:'Funding & Applications', short:'Funding',
  q:'How do you fund your next step?',
  goal:'Find suitable fellowships, small grants or travel funding and write a compelling, compliant application.',
  tasks:['Identify calls (fellowships, small grants, travel funds)','Write the application','Budget and work plan','Approval from supervisor and graduate school'],
  uc:[
   U('Funding matching','Filter calls by topic, funding level, deadlines and eligibility, and match them to your profile.',['recherche','agentisch'],2,1,'Delegate'),
   U('Application structure aligned to criteria','Align structure and argument directly with the call’s assessment criteria.',['generierung','synthese'],3,2,'Co-create'),
   U('Reviewer simulation','Have your draft critically assessed from a reviewer’s perspective: weaknesses, gaps, ambiguities.',['analyse'],3,1,'Assist'),
   U('Work plan & timeline','Derive work packages, milestones and dependencies from the project text and present them as a draft Gantt chart.',['generierung'],2,1,'Co-create'),
   U('Partner search','Identify potential collaborators from publication and project data.',['recherche','analyse'],2,2,'Assist')
  ],
  limits:['Funders regulate AI use: applicants remain fully responsible, and reviewers are generally not permitted to use generative AI – check the funder’s policy.','Do not enter confidential application content into tools without data protection.','Generic text stands out in review – sharpen your profile rather than smoothing it.'],
  disc:['Which rules would you need before using AI for an application?','How do you keep an application sounding like you?']},
 {id:'erhebung', name:'Data Collection', short:'Data Collection',
  q:'How do we obtain the data we need – efficiently and lawfully?',
  goal:'Collect, capture and document high-quality data.',
  tasks:['Field access and recruitment','Fieldwork (interviews, surveys, experiments, archives)','Transcription','Capturing unstructured sources','Documentation'],
  uc:[
   U('Transcription & translation','Transcribe interviews and focus groups, separate speakers and translate where needed – only with approved tools.',['analyse'],3,3,'Delegate'),
   U('Extraction from documents','Obtain structured data from PDFs, reports, websites or archives (e.g. key figures, statements, metadata).',['analyse','agentisch'],3,2,'Delegate'),
   U('LLM as annotator','Pre-annotate large volumes of text against a coding scheme; humans check samples using an agreement measure.',['analyse'],3,2,'Delegate'),
   U('Adaptive surveying','Conversational interviews or surveys that ask follow-up questions dynamically – with clear ethical guardrails.',['generierung','agentisch'],2,3,'Delegate'),
   U('Dataset discovery','Find open secondary data and repositories for the research question and assess their suitability.',['recherche'],2,1,'Assist'),
   U('Pseudonymising transcripts','Detect and replace names, places and other identifiers before analysis – in an approved environment, always checked by hand.',['analyse'],2,3,'Assist'),
   U('Reading historical & handwritten sources','Transcribe printed or handwritten archival material (OCR/HTR) and draft first translations for close reading.',['analyse','generierung'],2,2,'Co-create')
  ],
  limits:['Process personal and sensitive data only in approved, protected environments – and only as your ethics approval allows.','Participant information and ethics approval must cover AI processing; clarify the legal basis with your ethics committee or data protection officer.','Check transcription and annotation errors systematically through sampling.'],
  disc:['Do you know which of your data may go into which AI tool?','Where is your biggest manual data-capture effort?']},
 {id:'analyse', name:'Data Preparation & Analysis', short:'Analysis',
  q:'What do the data say – and how sure are we?',
  goal:'Clean and analyse data and derive results transparently and reproducibly.',
  tasks:['Data cleaning','Quantitative analysis','Qualitative analysis','Code, simulation and visualisation','Robustness checks'],
  uc:[
   U('Coding assistance for statistics','Generate, explain, debug and document analysis code (R, Python, Stata, SPSS syntax).',['generierung','analyse'],3,2,'Co-create'),
   U('Data cleaning','Detect inconsistencies, outliers and missing values; record cleaning steps as a script.',['analyse'],3,1,'Co-create'),
   U('Qualitative coding','Propose a coding frame, carry out first-pass coding and condense categories – with human validation. Check whether this fits your approach: reflexive methods are critical of AI coding.',['analyse','synthese'],3,2,'Co-create'),
   U('Text as data','Classification, sentiment analysis and topic modelling of large text corpora with language models.',['analyse'],3,2,'Delegate'),
   U('Conversational exploratory analysis','Explore datasets in natural language (“How is … distributed?”) and surface initial patterns.',['analyse','agentisch'],2,2,'Assist'),
   U('Visualisation','Create chart suggestions and publication-ready figures as reproducible code.',['generierung'],2,1,'Co-create'),
   U('Research software & simulation code','Write, refactor, test and document code for models, simulations or lab data pipelines.',['generierung','analyse'],3,2,'Co-create')
  ],
  limits:['Plausible-looking but wrong code – verify results independently.','Easier “fishing” for significance: pre-specify analysis plans.','Reproducibility: record date, tool, prompt and the saved output; keep analyses as code.'],
  disc:['Which analysis steps would you never leave to AI without checking?','How do you keep your analysis reproducible when the tools keep changing?']},
 {id:'publikation', name:'Writing, Thesis & Publishing', short:'Writing & Thesis',
  q:'How do we make results verifiable and visible?',
  goal:'Write the thesis and papers clearly, accurately and in line with the rules – and be able to defend every part of it.',
  tasks:['Structure and write chapters and papers','Revise language and style','Select a journal and format','Submission, peer review and revision','Viva preparation'],
  uc:[
   U('Structure & line of argument','Check the narrative thread, uncover gaps in the argument and adapt the structure to journal conventions.',['synthese','analyse'],3,1,'Co-create'),
   U('Language editing','Improve clarity, precision and flow – especially when writing in a second language. For the thesis, check your university’s rules on editing and proofreading.',['generierung'],3,2,'Assist'),
   U('Consistency check','Reconcile figures across text, tables and abstract, harmonise terminology and check citations against the reference list.',['analyse'],3,1,'Delegate'),
   U('Journal selection & formatting','Find suitable journals by scope and requirements; apply formatting guidelines.',['recherche','agentisch'],2,1,'Delegate'),
   U('Pre-submission review','Have the text assessed as a critical reviewer would: weaknesses in method, contribution and limitations.',['analyse'],3,1,'Assist'),
   U('Responding to reviewers','Structure reviewer comments and draft the response letter and summary of changes.',['synthese','generierung'],2,1,'Co-create'),
   U('Thesis structure across chapters','Check the golden thread from research questions to conclusions across chapters; spot gaps, overlaps and repetition.',['synthese','analyse'],3,2,'Co-create'),
   U('Mock viva preparation','Generate likely examiner questions from your thesis and practise your answers – a complement to, not a substitute for, your supervisors.',['generierung','analyse'],3,1,'Co-create')
  ],
  limits:['AI cannot be an author; responsibility lies with you (COPE). In a thesis, you must be able to explain and defend every passage.','Declare AI use as your university and publisher require.','Co-authored or third parties’ unpublished manuscripts only with their consent – never upload peer-review manuscripts.'],
  disc:['How would you declare AI use in your thesis or paper?','Where does language polishing end and substantive contribution begin?']},
 {id:'transfer', name:'Knowledge Exchange & Impact', short:'Impact',
  q:'Who should know about it – and what should change?',
  goal:'Communicate findings to each audience, and create and evidence societal impact.',
  tasks:['Conference talks and posters','Science communication','Transfer to practice and policy','Teaching duties','Documenting impact'],
  uc:[
   U('Audience-specific formats','Derive lay summaries, policy briefs, blog posts or social media posts from a paper.',['generierung','synthese'],3,1,'Co-create'),
   U('Presentations & visuals','Draft slides, posters, infographics and explanatory graphics from results.',['generierung'],3,1,'Co-create'),
   U('Research-informed teaching','Develop case studies, exercises and questions for your teaching from current research findings.',['generierung'],2,1,'Co-create'),
   U('Gathering impact evidence','Find mentions in policy, media and practice and structure them as evidence of impact.',['recherche','agentisch'],2,2,'Delegate'),
   U('Multilingual dissemination','Translate content for international audiences and adapt it culturally.',['generierung'],2,1,'Assist')
  ],
  limits:['Simplification must not overstate findings – key messages need your expert sign-off.','Label AI-generated images as such and check copyright and image rights.','Marking or feedback on student work with AI is usually not permitted – check your department’s rules.'],
  disc:['Which formats do you never get round to producing?','Who checks a simplified version of your findings before it goes out?']},
 {id:'querschnitt', name:'Your PhD Toolkit: planning, supervision, data & skills', short:'PhD toolkit', cross:true,
  q:'What helps across the whole doctorate?',
  goal:'Plan your doctorate, work well with your supervisors, manage your data and build skills – responsibly.',
  tasks:['PhD planning and time management','Supervision','Annual and progress reviews','Research data management','Skills development','AI declarations and integrity'],
  uc:[
   U('Supervision meetings','Prepare agendas and questions for supervision and summarise agreed actions afterwards from your own notes.',['synthese','generierung'],3,1,'Assist'),
   U('Annual review & progress reports','Structure progress, plans and risks for annual, transfer or confirmation reviews from your notes and earlier reports.',['generierung','synthese'],2,2,'Co-create'),
   U('PhD planning & time management','Break the doctorate into milestones, plan your weeks and re-plan after setbacks.',['generierung'],2,1,'Assist'),
   U('Personal knowledge base','Bring notes, papers and ideas together so that you can search and connect them.',['recherche','synthese'],3,2,'Assist'),
   U('Metadata & FAIR data','Suggest metadata, codebooks and README files for data publications.',['generierung'],2,1,'Co-create'),
   U('AI use log','Record date, tool, prompt and saved output for each step – the basis for your AI declaration in the thesis.',['agentisch'],2,1,'Assist'),
   U('Learning new skills','Learn a method, statistics package or programming language step by step with an AI tutor – and test yourself.',['generierung'],2,1,'Assist'),
   U('Research agents with checkpoints','Let agents carry out multi-step tasks (search → extraction → report) with defined human checkpoints.',['agentisch'],3,3,'Delegate')
  ],
  limits:['Your university’s AI policy and data rules decide which tools you may use – check before uploading anything.','Use the university-provided tool with your university login rather than personal accounts.','Keep your thesis your own: be ready to explain and defend every passage in your viva.'],
  disc:['What would go into your own AI use log – and who would read it?','Which part of your doctorate would you never hand to AI?']}
];
PHASES.forEach(p=>p.uc.forEach((u,i)=>{u.id=p.id+'-'+i;u.phase=p.id;}));

const TCATS = ['Literature search','Search engines','Literature & source analysis','Reference management','Academic writing','Qualitative analysis & transcription','Quantitative analysis','All-rounders & other'];
const T = (n,url,cat,r,c,typ,ph,nt)=>({n,url,cat,r,c,typ,ph,nt});
const TOOLS = [
 T('Epsilon','epsilon-ai.com',0,5.0,1,'ki',['literatur','idee'],'AI search across 200M+ papers and patents; answers with inline citations.'),
 T('Semantic Scholar','semanticscholar.org',0,4.7,6,'ki',['literatur','idee'],'TL;DR summaries and recommendations; few hits for some specific search terms.'),
 T('Open Knowledge Maps','openknowledgemaps.org',0,3.8,6,'ki',['idee','literatur'],'Visual topic maps; map generation often fails and search terms stay vague.'),
 T('Elicit','elicit.com',0,3.8,4,'ki',['literatur'],'Research question in natural language; extraction into tables (e.g. population, intervention).'),
 T('Inciteful','inciteful.xyz',0,2.0,1,'ki',['literatur','idee'],'Citation network from seed papers – good for deep dives, but cluttered.'),
 T('Google Scholar','scholar.google.com',1,4.7,10,'et',['literatur','idee'],'Broad coverage and “cited by”; no substitute for subject databases.'),
 T('Perplexity','perplexity.ai',1,4.6,7,'ki',['idee','literatur'],'Answer engine with sources – strong for getting into a topic.'),
 T('Consensus','consensus.app',1,null,0,'ki',['literatur','idee'],'Answers drawn from peer-reviewed studies; some results lack full-text access.'),
 T('Humata AI','humata.ai',2,4.8,6,'ki',['literatur'],'Ask questions of PDFs with highlighted passages; free tier limited to 60 pages.'),
 T('Connected Papers','connectedpapers.com',2,4.8,5,'ki',['literatur','idee'],'Accurate forward/backward search from a seed paper; limited thematic overview.'),
 T('Research Rabbit','researchrabbitapp.com',2,5.0,1,'ki',['literatur','idee'],'Network maps of related studies, authors and citations.'),
 T('ChatPDF','chatpdf.com',2,4.5,2,'ki',['literatur'],'Chat with individual PDFs; often compared with NotebookLM.'),
 T('Scholar AI',null,2,4.0,1,'gpt',['literatur'],'Custom GPT: find, analyse and summarise sources.'),
 T('Zotero','zotero.org',3,4.8,12,'et',['literatur','publikation','querschnitt'],'Free and open source; browser connector and shared group libraries.'),
 T('Citavi','lumivero.com',3,5.0,2,'et',['literatur','publikation'],'References, knowledge organisation and task planning in one tool.'),
 T('EndNote','endnote.com',3,null,0,'et',['literatur','publikation'],'Comprehensive reference management with 7,000+ citation styles.'),
 T('Mendeley','mendeley.com',3,null,0,'et',['literatur','publikation'],'Free; automatic metadata capture and shared libraries.'),
 T('Paperpile','paperpile.com',3,null,0,'et',['literatur','publikation'],'Browser-based and tightly integrated with Google Docs.'),
 T('Scholar GPT',null,4,5.0,3,'gpt',['publikation','idee'],'Custom GPT: sharpen research questions and write in an academic register.'),
 T('QuillBot','quillbot.com',4,4.7,3,'ki',['publikation'],'Paraphrasing and grammar; double-check meaning and citations.'),
 T('DeepL Write','deepl.com/write',4,4.5,11,'ki',['publikation','transfer'],'Style, tone and grammar in several languages – widely used for academic text.'),
 T('Napkin AI','napkin.ai',4,4.0,1,'ki',['transfer','publikation'],'Turns text into diagrams, infographics and mind maps.'),
 T('Hemingway','hemingwayapp.com',4,3.5,2,'ki',['publikation'],'Readability analysis; file upload and AI features are subscription-only.'),
 T('Hesse AI','hesse.ai',4,3.0,2,'ki',['publikation'],'Essay generation and flashcards; paid, with an academic-integrity risk.'),
 T('Abstract Generator',null,4,null,0,'gpt',['publikation'],'Custom GPT: structured abstracts from aim, method and results.'),
 T('Jenni AI','jenni.ai',4,null,0,'ki',['publikation'],'Autocomplete, outlining and automatic citation.'),
 T('Paperpal','paperpal.com',4,null,0,'ki',['publikation'],'Academic language editing and a submission-readiness check.'),
 T('Mimir Mentor','mimir-mentor.com',4,null,0,'ki',['publikation','literatur'],'Search, text generation and correction for academic work.'),
 T('TurboScribe','turboscribe.ai',5,5.0,1,'ki',['erhebung'],'Fast, accurate transcription in many languages.'),
 T('Sally AI','sally.io',5,5.0,1,'ki',['erhebung','querschnitt'],'Meeting transcription with summary and action items.'),
 T('MAXQDA','maxqda.com',5,4.7,3,'et',['analyse','erhebung'],'Professional QDA software incl. AI features; powerful, but a steep learning curve.'),
 T('AudioPen','audiopen.ai',5,3.0,1,'ki',['erhebung'],'Turns voice notes into cleaned-up draft text.'),
 T('Otter.ai','otter.ai',5,null,0,'ki',['erhebung','querschnitt'],'Meeting transcription; language coverage varies – check before use.'),
 T('Qualitative Insights',null,5,null,0,'gpt',['analyse'],'Custom GPT: themes, patterns and initial codes.'),
 T('Qualitative Data Analysis',null,5,null,0,'gpt',['analyse'],'Custom GPT: thematic coding and condensation.'),
 T('Taguette','taguette.org',5,null,0,'et',['analyse'],'Free, open-source QDA: highlight, tag and export.'),
 T('NVivo','lumivero.com/products/nvivo',5,null,0,'et',['analyse'],'Established QDA software; paid – check for a campus licence.'),
 T('Whisper (OpenAI)','github.com/openai/whisper',5,null,0,'ki',['erhebung'],'Open-source speech recognition model; can run locally so that audio stays on your machine.'),
 T('Statistik GPT',null,6,5.0,3,'gpt',['analyse','design'],'Custom GPT: choosing methods, explaining them and writing up results.'),
 T('Jamovi','jamovi.org',6,5.0,1,'et',['analyse'],'Free; shows the underlying R code.'),
 T('Statistic & Data Analyst',null,6,4.0,2,'gpt',['analyse'],'Custom GPT: test selection, explaining R/Python/SPSS, methods section.'),
 T('JASP','jasp-stats.org',6,null,0,'et',['analyse'],'Frequentist and Bayesian analyses with APA-style tables.'),
 T('LMArena','lmarena.ai',7,5.0,2,'ki',['querschnitt'],'Blind comparison of language models – guidance for choosing a model.'),
 T('Obsidian','obsidian.md',7,5.0,2,'et',['querschnitt','literatur'],'Local, linked knowledge management with Zotero integration.'),
 T('Notion','notion.com',7,4.3,6,'et',['querschnitt'],'Project and literature organisation with AI features.'),
 T('NotebookLM','notebooklm.google',7,4.3,10,'ki',['literatur','querschnitt','transfer'],'Ask questions of your own sources; audio overviews and flashcards.'),
 T('STORM','storm.genie.stanford.edu',7,null,0,'ki',['idee','publikation'],'Researches automatically and produces an outline with citations.'),
 T('PopAI','popai.pro',7,null,0,'ki',['querschnitt'],'All-in-one platform; check subscription terms carefully.'),
 T('Litmaps','litmaps.com',0,null,0,'ki',['literatur','idee'],'Citation maps that grow from seed papers and track new publications.'),
 T('ASReview','asreview.nl',2,null,0,'ki',['literatur'],'Open-source active-learning screening for systematic reviews.'),
 T('Rayyan','rayyan.ai',2,null,0,'ki',['literatur'],'Collaborative screening for systematic reviews with AI-assisted prioritisation.'),
 T('Covidence','covidence.org',2,null,0,'et',['literatur'],'Systematic review management: screening, extraction and appraisal; often licensed by universities.'),
 T('scite','scite.ai',2,null,0,'ki',['literatur','publikation'],'Shows whether citing papers support or contrast a finding.'),
 T('Transkribus','transkribus.org',5,null,0,'ki',['erhebung'],'Handwritten text recognition (HTR) for historical documents.'),
 T('Overleaf','overleaf.com',4,null,0,'et',['publikation'],'Collaborative LaTeX writing, common for theses in STEM subjects.'),
 T('GitHub Copilot','github.com/features/copilot',7,null,0,'ki',['analyse'],'AI coding assistant in the code editor; education offers are available.')
];

// MCP servers per tool (checked 28 October 2026): [o = official / c = community, remote server?, source, note]
const MCP = {
 'Semantic Scholar':['o',1,'https://allenai.org/asta/resources/mcp','Ai2 Asta server on the Semantic Scholar corpus; API key optional.'],
 'Elicit':['o',1,'https://support.elicit.com/en/articles/14757404-use-elicit-via-mcp-server','Sign-in with your account; Pro plan or higher.'],
 'Perplexity':['o',1,'https://docs.perplexity.ai/guides/mcp-server','Remote or local; uses the paid Perplexity API.'],
 'Consensus':['o',1,'https://docs.consensus.app/consensus-mcp','Sign-in; small free monthly allowance.'],
 'DeepL Write':['o',1,'https://developers.deepl.com/docs/mcp','Remote with sign-in or local with API key; rephrasing needs Write.'],
 'Napkin AI':['o',1,'https://api.napkin.ai/faq/index.html','Beta; sign-in, uses Napkin credits.'],
 'Litmaps':['o',1,'https://docs.litmaps.com/en/articles/17508256-use-litmaps-with-your-ai-assistant-mcp','Beta; reads and edits your maps.'],
 'scite':['o',1,'https://scite.ai/mcp','Sign-in; paid plan or trial.'],
 'Sally AI':['o',1,'https://www.sally.io/api-integration/claude','Read-only access to meetings; admin must enable it.'],
 'Otter.ai':['o',1,'https://help.otter.ai/hc/en-us/articles/35287607569687-Otter-MCP-Server','Sign-in; search and fetch your transcripts.'],
 'Notion':['o',1,'https://developers.notion.com/docs/mcp','Remote with sign-in, or local with a token.'],
 'GitHub Copilot':['o',1,'https://github.com/github/github-mcp-server','GitHub’s own server; Copilot in VS Code is also an MCP client.'],
 'JASP':['o',0,'https://github.com/jasp-stats/jasp-mcp','Local, early stage; JASP must be running.'],
 'Scholar AI':['o',0,'https://scholarai.io/blog/mcp','Local; needs a ScholarAI API key.'],
 'Zotero':['c',0,'https://github.com/54yyyu/zotero-mcp','Reads your local library or the Zotero web API.'],
 'EndNote':['c',0,'https://github.com/gokmengokhan/endnote-mcp','Works on an XML export of your library.'],
 'Mendeley':['c',0,'https://github.com/pallaprolus/mendeley-mcp','Uses the Mendeley API; register your own app.'],
 'Google Scholar':['c',0,'https://github.com/JackKuo666/Google-Scholar-MCP-Server','No official API – scrapes results; may break.'],
 'Whisper (OpenAI)':['c',0,'https://github.com/kachiO/mlx-whisper-mcp','Local transcription, audio stays on your machine.'],
 'Jamovi':['c',0,'https://github.com/yjm110517/jamovi-mcp','Controls a local jamovi installation.'],
 'Obsidian':['c',0,'https://github.com/MarkusPfundstein/mcp-obsidian','Needs the Local REST API plugin.'],
 'NotebookLM':['c',0,'https://github.com/PleasePrompto/notebooklm-mcp','No official API – automates the browser; fragile.'],
 'Transkribus':['c',0,'https://github.com/lazyants/transkribus-mcp-server','Needs your Transkribus credentials.'],
 'Overleaf':['c',0,'https://github.com/mjyoo2/OverleafMCP','Via Overleaf’s Git integration (paid plans).']
};

// Microsoft 365 integrations per tool (checked 28 October 2026): [type, source]
// copilot = Copilot connector or agent (needs a Microsoft 365 Copilot licence and IT approval)
const M365 = {
 'Consensus':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/connectors-gallery-microsoft']],
 'scite':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/federated-connectors-overview']],
 'DeepL Write':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/connectors-gallery-microsoft'],['word','https://www.deepl.com/word-addin'],['teams','https://marketplace.microsoft.com/en-us/product/office/WA200007424'],['power','https://learn.microsoft.com/en-us/connectors/deepl/'],['outlook','https://marketplace.microsoft.com/en-us/product/WA200006684']],
 'Notion':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/federated-connectors-overview'],['teams','https://www.notion.com/help/microsoft-teams-notifications'],['power','https://learn.microsoft.com/en-us/connectors/notionip/'],['files','https://www.notion.com/help/notion-ai-connector-for-microsoft-sharepoint-and-onedrive']],
 'GitHub Copilot':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/github-cloud-knowledge-overview'],['teams','https://docs.github.com/en/integrations/how-tos/teams/integrate-github-with-teams'],['power','https://learn.microsoft.com/en-us/connectors/github/']],
 'Perplexity':[['word','https://marketplace.microsoft.com/en-us/product/WA200010847'],['teams','https://marketplace.microsoft.com/en-us/product/WA200010619'],['power','https://learn.microsoft.com/en-us/connectors/perplexityai/'],['outlook','https://marketplace.microsoft.com/en-us/product/WA200010911']],
 'Zotero':[['word','https://www.zotero.org/support/word_processor_plugin_usage'],['edge','https://microsoftedge.microsoft.com/addons/detail/nmhdhpibnnopknkmonacoephklnflpho']],
 'Citavi':[['word','https://marketplace.microsoft.com/en-us/product/WA200002891']],
 'EndNote':[['word','https://docs.endnote.com/docs/endnote/2025/v1/windows/en/content/09word/installing_cwywsprtinword.htm'],['edge','https://microsoftedge.microsoft.com/addons/detail/endnote-click/jaleebmaoohbjjohjlfmihkkopgfibne']],
 'Mendeley':[['word','https://marketplace.microsoft.com/en-us/product/office/wa104382081'],['edge','https://microsoftedge.microsoft.com/addons/detail/mendeley-web-importer/mbcgpelmjnpfbdnkbebdlfjmeckpnhha']],
 'Paperpile':[['word','https://paperpile.com/word-plugin/']],
 'Paperpal':[['word','https://marketplace.microsoft.com/en-us/product/office/wa200001361']],
 'QuillBot':[['word','https://quillbot.com/word'],['edge','https://microsoftedge.microsoft.com/addons/detail/quillbot-ai-writing-and-/cphpplikchcioccedpjacdanfibnimmh']],
 'Google Scholar':[['edge','https://microsoftedge.microsoft.com/addons/detail/google-scholar-button/fciokoalnclhnonofghacdplgpafdcgl']],
 'Otter.ai':[['teams','https://otter.ai/integration/microsoft-teams'],['outlook','https://otter.ai/integration/microsoft-outlook'],['files','https://otter.ai/integration/microsoft-onedrive']],
 'Sally AI':[['teams','https://www.sally.io/api-integration/microsoft-teams'],['outlook','https://www.sally.io/api-integration/automation-zapier-make-power-automate']],
 'Whisper (OpenAI)':[['azure','https://learn.microsoft.com/en-us/azure/ai-services/speech-service/whisper-overview']]
};
const M365_TYPE = {copilot:'Copilot connector', word:'Word add-in', teams:'Teams', power:'Power Automate', outlook:'Outlook', files:'OneDrive / SharePoint', edge:'Edge extension', azure:'Azure AI Speech'};

// Agenda (final, as agreed) – titles and times must not change
const AGENDA = [
 ['12:45','12:50','Welcome and Setting the Scene','Helen & Ernest'],
 ['12:50','13:15','So, where do we all stand?','Oliver'],
 ['13:15','13:30','Wait, where does my data go?','Tom'],
 ['13:30','14:45','Why did it say that? A common baseline for prompting','Tom'],
 ['14:45','15:00','Coffee Break',''],
 ['15:00','16:45','Where does AI actually help me? Let\'s focus on your Research Process','Manuel + Team'],
 ['16:45','17:00','So, what changes on Monday?','Oliver']
];
const AGENDA_DAY = '2026-11-04', TOOL_SLOT = 5;
// Team: photo = path under assets/team/ once available
const TEAM = [
 {n:'Oliver', role:'', photo:''},
 {n:'Tom', role:'', photo:''},
 {n:'Thomas', role:'', photo:''},
 {n:'Manuel', role:'', photo:''}
];

const GAINS = [['time','Saves time'],['quality','Better quality'],['new','New possibility'],['learn','I learn']];

const CLUSTERS = [
 {n:'Literature and research question', ph:['idee','literatur']},
 {n:'Data collection', ph:['design','erhebung']},
 {n:'Analysis', ph:['analyse']},
 {n:'Writing and publishing', ph:['publikation','transfer']},
 {n:'Planning and admin', ph:['foerderung','querschnitt']}
];

const SOURCES = [
 ['Microsoft Learn – Copilot Chat FAQ','https://learn.microsoft.com/en-us/copilot/faq'],
 ['Microsoft Learn – Copilot Chat overview','https://learn.microsoft.com/en-us/copilot/overview'],
 ['Microsoft Learn – Privacy and protections in Copilot Chat','https://learn.microsoft.com/en-us/copilot/privacy-and-protections'],
 ['Microsoft Learn – Agents in Copilot Chat','https://learn.microsoft.com/en-us/copilot/agents'],
 ['Microsoft Learn – Connect an agent to an existing MCP server (Copilot Studio)','https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent'],
 ['Microsoft Learn – Publish an agent to Teams and Microsoft 365 Copilot','https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams'],
 ['Microsoft Learn – Federated Copilot connectors','https://learn.microsoft.com/en-us/microsoftsearch/federated-connectors-overview'],
 ['Microsoft Learn – Purchase and manage agents in Copilot Chat','https://learn.microsoft.com/en-us/copilot/manage-agents-copilot-chat']
];
const VERSION = 'v5 · 28 October 2026';
