/* AI in the Research Process – content data (phases, use cases, tools, technology assessment) */
const RISK = {1:'Low risk',2:'Medium risk',3:'High risk'};
const RISK_DEF = {1:'Public or your own non-sensitive material; errors are easy to spot.',2:'Your own unpublished drafts, reviews or third-party content.',3:'Personal or sensitive data, or decisions that feed directly into your results.'};
const MODE_DEF = {'Assist':'You lead; AI provides suggestions on request.','Co-create':'You and AI develop the result iteratively together.','Delegate':'AI carries out a sub-task; you check the result at defined points.'};

const U = (t,d,cap,pot,risk,mode,ix=[])=>({t,d,cap,pot,risk,mode,ix});   // ix: tools in MCP/M365 that connect to Copilot
const PHASES = [
 {id:'idee', name:'Ideation & Research Question', short:'Idea & Question',
  q:'Which relevant, open question is worth investigating?',
  goal:'Identify a research gap and formulate a precise, answerable research question.',
  tasks:['Scope the research field','Check relevance and novelty','Formulate the research question and objectives','Derive hypotheses or propositions'],
  uc:[
   U('Topic and trend scouting','Group a list of recent titles into themes, count them per year and spot rarely combined topics – a first hypothesis to test with a bibliometric tool or a connected database such as OpenAlex.',['recherche','analyse'],2,1,'Assist',['OpenAlex','Litmaps']),
   U('Sparring partner for research questions','Turn rough ideas into alternative research questions, surface assumptions, and generate counter-positions and objections.',['generierung'],3,1,'Co-create'),
   U('Structured operationalisation','Structure questions with established frameworks (e.g. PICO, PICOC, SPIDER, PEO), derive sub-questions and search terms per element, sharpen the constructs and test the question against FINER.',['generierung','synthese'],2,1,'Co-create'),
   U('Novelty check','Semantic search for closely related work to spot duplication early and sharpen your positioning.',['recherche'],3,2,'Assist',['Semantic Scholar','OpenAlex','Consensus','Elicit']),
   U('Interdisciplinary bridges','Suggest concepts and methods from neighbouring disciplines that transfer to your research question.',['generierung','recherche'],2,1,'Co-create'),
   U('Research gap mapping','Sort the gaps a body of literature leaves into types – empirical, methodological, theoretical, practical or contradictory findings – and back each one with the studies that show it.',['synthese','analyse'],3,2,'Co-create'),
   U('Theoretical framework & hypotheses','Compare candidate theories for your question, derive hypotheses or propositions with their reasoning, and describe the conceptual model in words.',['generierung','synthese'],3,2,'Co-create')
  ],
  limits:['Apparent “gaps” may simply be gaps in the model’s knowledge – always verify against subject databases.','Popularity bias: models reinforce established mainstream topics.','Judging originality and relevance remains your task – and your supervisor’s.'],
  disc:['Where do you get stuck most when narrowing down a topic?','Under what conditions would you trust an AI-generated research question?']},
 {id:'literatur', name:'Literature Search & Review', short:'Literature',
  q:'What do we already know – and how robust is it?',
  goal:'Find, understand, appraise and synthesise relevant literature into a state of the art.',
  tasks:['Choose the review type and protocol','Develop a search strategy','Search subject databases','Read and understand key papers','Screen, extract and appraise','Synthesise findings'],
  uc:[
   U('Search string development','Draft and iteratively refine Boolean search strings, including synonyms and subject headings, for bibliographic databases – and check them against the PRESS checklist before you run them.',['generierung'],3,1,'Co-create'),
   U('Semantic search & citation networks','Search by meaning rather than keywords, follow forward and backward citations, or let a research agent run a multi-step search and draft a cited overview.',['recherche'],3,1,'Assist',['Semantic Scholar','OpenAlex','Consensus','Litmaps','Paper Search MCP']),
   U('AI-assisted screening','Prioritise results by relevance and get include / exclude / unclear suggestions with the deciding criterion, at title-and-abstract and full-text stage; use AI as a second screener and measure agreement (e.g. Cohen’s kappa) – you make the final call.',['analyse','agentisch'],3,3,'Delegate'),
   U('Data extraction into evidence tables','Transfer sample, method, variables and effects – including effect sizes for a meta-analysis – from full texts into structured tables, with a second, independent check.',['analyse'],3,3,'Co-create',['Elicit']),
   U('Querying your own PDF corpus','Make your literature library searchable – for example in a Copilot notebook or through your reference manager – and get answers with verified source passages.',['recherche','synthese'],3,2,'Assist',['Zotero','EndNote','Mendeley']),
   U('Synthesis & concept matrix','Compare findings across studies, flag contradictions and draft a concept matrix (Webster & Watson) showing which concepts each study covers fully, partly or not at all.',['synthese'],2,3,'Co-create'),
   U('Understanding difficult or non-English papers','Have concepts, methods, notation or statistics explained in plain language, or translate and summarise sources in other languages – then check against the original and quote only verified translations.',['synthese','generierung'],3,2,'Assist'),
   U('Choosing the review type & protocol','Check whether a systematic, scoping or narrative review fits your question, the literature and your time – and draft the protocol, including testable inclusion and exclusion criteria and borderline cases.',['generierung','synthese'],2,2,'Co-create'),
   U('Documenting the review (PRISMA)','Turn your search log, counts per stage and exclusion reasons into PRISMA flow numbers, remove duplicates, check your report against the PRISMA 2020 checklist and draft the methods paragraph.',['synthese','generierung'],2,2,'Assist'),
   U('Quality appraisal of studies','Appraise each study with an established checklist (e.g. CASP, MMAT, JBI), criterion by criterion with the supporting passage – the judgement stays yours.',['analyse'],3,3,'Co-create')
  ],
  limits:['Fabricated or misattributed references – verify every source.','Uploading papers: publisher licences and your library’s guidance decide what may be shared with AI tools.','Coverage gaps: paywalled content and non-English literature are often missing.','Systematic reviews need a pre-specified, ideally registered protocol and reproducible, documented decisions, reported in line with PRISMA 2020 – document every AI step.'],
  disc:['Which review step takes you the most time?','How would you document AI steps so that your review stays reproducible?']},
 {id:'design', name:'Research Design & Methodology', short:'Design & Methods',
  q:'How do we answer the question validly and ethically?',
  goal:'Develop a robust design with a suitable method, sample and instruments, plus ethics approval and a data management plan.',
  tasks:['Choose method and design','Develop instruments (questionnaire, interview guide, protocol)','Plan the sample','Ethics approval and data management plan','Pre-registration where relevant'],
  uc:[
   U('Methods advice','Compare design alternatives with their pros and cons, plan experiments (conditions, variables, controls) – including designs that need fewer runs, such as factorial or response-surface designs – and work systematically through threats to validity.',['generierung','synthese'],2,2,'Co-create'),
   U('Instrument development','Draft items, interview guides and response scales; check for clarity and for double-barrelled or leading questions, and map every item to your research questions – also across survey and interview in mixed methods.',['generierung'],3,2,'Co-create'),
   U('Pre-testing with synthetic personas','Test instruments with simulated respondents for comprehension issues – as a supplement to real pre-tests, never a replacement.',['generierung','analyse'],2,2,'Assist'),
   U('Sample size & power analysis','Generate calculations as traceable code – Copilot runs Python itself and writes R code for you to run – and make assumptions explicit.',['analyse'],2,2,'Assist'),
   U('Ethics application & data management plan','Structure drafts along your institution’s templates – the study-specific reasoning on consent, risks and anonymisation must be your own.',['generierung'],3,2,'Co-create'),
   U('Final survey check','Let Copilot walk through the finished questionnaire along different answer paths to find broken routing, missing or overlapping answer options and inconsistent scales – and proofread it as a whole.',['analyse','generierung'],3,2,'Assist'),
   U('Conceptual & measurement model diagrams','Turn your theory into a conceptual or measurement model diagram – constructs, paths and, where needed, survey items – as editable draw.io or Figma content you update with the literature instead of redrawing it.',['generierung','synthese'],3,1,'Co-create',['draw.io','Figma']),
   U('Experimental stimuli & instruments','Generate matched materials for each condition of an experiment – e.g. case vignettes, a message in two framings, a mock web page or news feed – and draft the study flow with randomisation and variable names for your survey tool.',['generierung','agentisch'],3,2,'Co-create')
  ],
  limits:['Synthetic “respondents” do not validly represent real populations.','Methodological responsibility and disciplinary conventions rest with you and your supervisory team.','Ethics committees expect study-specific reflection – generic AI text on consent or anonymisation can be wrong.'],
  disc:['Where could AI measurably improve the quality of your instruments?','What role should synthetic data be allowed to play in your research?']},
 {id:'erhebung', name:'Data Collection', short:'Data Collection',
  q:'How do we obtain the data we need – efficiently and lawfully?',
  goal:'Collect, capture and document high-quality data.',
  tasks:['Field access and recruitment','Fieldwork (interviews, surveys, experiments, archives)','Transcription','Capturing unstructured sources','Documentation'],
  uc:[
   U('Transcription & translation','Transcribe interviews and focus groups, separate speakers and translate where needed – only with approved tools.',['analyse'],3,3,'Delegate',['Otter.ai','Whisper (OpenAI)']),
   U('Extraction from documents','Obtain structured data from reports, web pages, archival records or data documentation (e.g. key figures, statements, metadata).',['analyse','agentisch'],3,3,'Delegate'),
   U('LLM as annotator','Pre-annotate large volumes of text against a coding scheme; humans check samples using an agreement measure.',['analyse'],3,3,'Delegate'),
   U('Adaptive surveying','Conversational interviews or surveys that ask follow-up questions dynamically – with clear ethical guardrails.',['generierung','agentisch'],2,3,'Delegate'),
   U('Dataset discovery','Find open secondary data and repositories for the research question and assess their suitability.',['recherche'],2,1,'Assist'),
   U('Pseudonymising transcripts','Detect and replace names, places and other identifiers before analysis – in an approved environment, always checked by hand.',['analyse'],2,3,'Assist'),
   U('Reading historical & handwritten sources','Transcribe printed or handwritten archival material (OCR/HTR) and draft first translations for close reading.',['analyse','generierung'],2,2,'Co-create',['Transkribus']),
   U('Digitising whiteboards, flipcharts and card sorts','Turn photos of whiteboards, flipcharts or card sorts from workshops and experiments into structured data – transcribed, clustered and mapped (e.g. items to constructs) – ready for analysis.',['analyse','synthese'],3,3,'Co-create'),
   Object.assign(U('LLMs as a data source','Use the answers of language models themselves as research data – e.g. simulated interviews, “silicon samples” or audits of what models say – to study the models, not as a substitute for human participants.',['generierung','analyse'],2,3,'Assist'),{ex:true})
  ],
  limits:['Process personal and sensitive data only in approved, protected environments – and only as your ethics approval allows.','Participant information and ethics approval must cover AI processing; clarify the legal basis with your ethics committee or data protection officer.','Check transcription and annotation errors systematically through sampling.'],
  disc:['Do you know which of your data may go into which AI tool?','Where is your biggest manual data-capture effort?']},
 {id:'analyse', name:'Data Preparation & Analysis', short:'Analysis',
  q:'What do the data say – and how sure are we?',
  goal:'Clean and analyse data and derive results transparently and reproducibly.',
  tasks:['Data cleaning','Quantitative analysis','Qualitative analysis','Code, simulation and visualisation','Robustness checks'],
  uc:[
   U('Coding assistance for statistics','Generate, explain, debug and document analysis code (R, Python, Stata, SPSS syntax) – from regression to structural equation models or a meta-analysis.',['generierung','analyse'],3,2,'Co-create',['JASP','Jamovi','GitHub (repositories)']),
   U('Data cleaning','Detect inconsistencies, outliers and missing values; record cleaning steps as a script.',['analyse'],3,2,'Co-create'),
   U('Qualitative coding','Propose a coding frame, do first-pass coding, suggest candidate themes and verify every quote – with human validation. Check whether this fits your approach: saturation checks belong to codebook or grounded-theory approaches, and reflexive thematic analysis is critical of AI coding.',['analyse','synthese'],3,3,'Co-create'),
   U('Text as data','Classification, sentiment analysis and topic modelling of large text corpora with language models.',['analyse'],3,3,'Delegate'),
   U('Conversational exploratory analysis','Explore datasets in natural language (“How is … distributed?”) and surface initial patterns.',['analyse','agentisch'],2,2,'Assist'),
   U('Visualisation','Create chart suggestions and publication-ready figures as reproducible code.',['generierung'],2,1,'Co-create'),
   U('Research software & simulation code','Write, refactor, test and document code for models, simulations or lab data pipelines – and check numerical results against known solutions, benchmarks and physical plausibility (units, conserved quantities, value ranges).',['generierung','analyse'],3,2,'Co-create',['GitHub (repositories)']),
   U('Codebook with anchor examples','Turn a category system into a codebook – definition, inclusion and exclusion rules, anchor example and rule for borderline cases – and test it on a sample passage and with a second coder.',['analyse','generierung'],3,3,'Co-create'),
   U('Interpreting & reporting results','Have your own statistical output explained, check assumptions and quality criteria (e.g. reliability, model fit, validity of scales), ask which checks or analyses you may have missed, and draft an APA-style results paragraph.',['analyse','generierung'],3,2,'Co-create')
  ],
  limits:['Plausible-looking but wrong code – verify results independently.','Easier “fishing” for significance: pre-specify analysis plans.','Reproducibility: record date, tool, prompt and the saved output; keep analyses as code.'],
  disc:['Which analysis steps would you never leave to AI without checking?','How do you keep your analysis reproducible when the tools keep changing?']},
 {id:'publikation', name:'Writing, Thesis & Publishing', short:'Writing & Thesis',
  q:'How do we make results verifiable and visible?',
  goal:'Write the thesis and papers clearly, accurately and in line with the rules – and be able to defend every part of it.',
  tasks:['Structure and write chapters and papers','Revise language and style','Select a journal and format','Submission, peer review and revision','Viva preparation'],
  uc:[
   U('Structure & line of argument','Check the narrative thread, uncover gaps in the argument and adapt the structure to journal conventions.',['synthese','analyse'],3,2,'Co-create'),
   U('Language editing','Improve clarity, precision and flow – especially in a second language – and spot generic or AI-sounding phrasing so the text stays yours. For the thesis, check your university’s rules on editing and proofreading.',['generierung'],3,2,'Assist',['DeepL Write']),
   U('Consistency check','Reconcile figures across text, tables and abstract, harmonise terminology and match in-text citations to the reference list.',['analyse'],3,2,'Delegate'),
   U('Journal selection & formatting','Find suitable journals by scope and requirements; apply formatting guidelines, citation styles and LaTeX or BibTeX conventions.',['recherche','agentisch'],2,1,'Delegate',['Zotero','Overleaf']),
   U('Pre-submission review','Have the text assessed by a panel of critical reviewers – methods, theory, devil’s advocate – including missing reporting items for your design, and turn it into a revision roadmap.',['analyse'],3,2,'Assist'),
   U('Responding to reviewers','Structure reviewer comments and draft the response letter and summary of changes.',['synthese','generierung'],2,2,'Co-create'),
   U('Thesis structure across chapters','Check the golden thread from research questions to conclusions across chapters; spot gaps, overlaps and repetition.',['synthese','analyse'],3,2,'Co-create'),
   U('Mock viva preparation','Generate likely examiner questions from your thesis and practise your answers – a complement to, not a substitute for, your supervisors.',['generierung','analyse'],3,2,'Co-create'),
   U('Reference & claim check','Check that every reference exists and its details are correct – and that each cited source really supports the sentence it is cited for.',['recherche','analyse'],3,2,'Assist',['OpenAlex','scite','Zotero']),
   U('Section draft from your own notes','Turn your own notes and evidence map into a first draft of a section, every claim linked to its source. Rework it in your own words and declare the AI use – check your university’s rules first.',['generierung','synthese'],2,2,'Co-create')
  ],
  limits:['AI-drafted text must be reworked and declared – many universities restrict it in the thesis, so check the rules before drafting with AI.','AI cannot be an author; responsibility lies with you (COPE). In a thesis, you must be able to explain and defend every passage.','Declare AI use as your university and publisher require.','Co-authored or third parties’ unpublished manuscripts only with their consent – never upload peer-review manuscripts.'],
  disc:['How would you declare AI use in your thesis or paper?','Where does language polishing end and substantive contribution begin?']},
 {id:'transfer', name:'Knowledge Exchange & Impact', short:'Impact',
  q:'Who should know about it – and what should change?',
  goal:'Communicate findings to each audience, and create and evidence societal impact.',
  tasks:['Conference talks and posters','Science communication','Transfer to practice and policy','Teaching duties','Documenting impact'],
  uc:[
   U('Audience-specific formats','Derive lay summaries, policy briefs, blog posts or social media posts from a paper.',['generierung','synthese'],3,1,'Co-create'),
   U('Presentations & visuals','Draft slides, posters, infographics and explanatory graphics from results.',['generierung'],3,2,'Co-create',['Napkin AI']),
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
   U('Supervision meetings','Prepare agendas and questions for supervision and summarise agreed actions afterwards from your own notes.',['synthese','generierung'],3,2,'Assist',['Otter.ai']),
   U('Annual review & progress reports','Turn lab notebooks and notes into monthly progress reports for your supervisor, and structure progress, plans and risks for annual, transfer or confirmation reviews.',['generierung','synthese'],2,2,'Co-create'),
   U('PhD planning & time management','Break the doctorate into milestones, plan your weeks and re-plan after setbacks.',['generierung'],2,1,'Assist'),
   U('Personal knowledge base','Turn notes, highlights and annotations into atomic notes with a shared tag vocabulary and typed links, so that you can search and connect them in your notes tool.',['recherche','synthese'],3,2,'Assist',['Zotero','Notion','Obsidian']),
   U('Metadata, FAIR data & replication','Suggest metadata, codebooks and README files for data publications, assemble a replication package and check that every number in the paper can be reproduced from the code.',['generierung'],2,2,'Co-create',['GitHub (repositories)']),
   U('AI use & decision log','Record date, tool, prompt, saved output and the research decisions they informed – the basis for your AI declaration and a traceable thesis.',['agentisch'],2,1,'Assist'),
   U('Learning new skills','Learn a method, statistics package or programming language step by step with an AI tutor – and test yourself.',['generierung'],2,1,'Assist'),
   U('Project assistant & research agents','Set up an assistant that follows your standing rules (citation style, terminology, no invented sources), or let agents carry out multi-step tasks with defined human checkpoints.',['agentisch'],3,3,'Delegate'),
   U('Staying up to date','Sort new publications from alerts and journal tables of contents against your research question each week and decide what to read.',['recherche','synthese'],2,1,'Assist',['OpenAlex','Semantic Scholar'])
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
 T('Inciteful','incitefulmed.com/academic/',0,2.0,1,'ki',['literatur','idee'],'Citation network from seed papers – good for deep dives, but cluttered.'),
 T('Google Scholar','scholar.google.com',1,4.7,10,'et',['literatur','idee'],'Broad coverage and “cited by”; no substitute for subject databases.'),
 T('Perplexity','perplexity.ai',1,4.6,7,'ki',['idee','literatur'],'Answer engine with sources – strong for getting into a topic. Its Microsoft 365 add-ins are sold as Perplexity Computer.'),
 T('Consensus','consensus.app',1,null,0,'ki',['literatur','idee'],'Answers drawn from peer-reviewed studies; some results lack full-text access.'),
 T('Humata AI','humata.ai',2,4.8,6,'ki',['literatur'],'Ask questions of PDFs with highlighted passages; free tier limited to 60 pages.'),
 T('Connected Papers','connectedpapers.com',2,4.8,5,'ki',['literatur','idee'],'Accurate forward/backward search from a seed paper; limited thematic overview.'),
 T('Research Rabbit','researchrabbit.ai',2,5.0,1,'ki',['literatur','idee'],'Network maps of related studies, authors and citations.'),
 T('ChatPDF','chatpdf.com',2,4.5,2,'ki',['literatur'],'Chat with individual PDFs; often compared with Gemini Notebook (formerly NotebookLM).'),
 T('Scholar AI',null,2,4.0,1,'gpt',['literatur'],'Custom GPT: find, analyse and summarise sources. ScholarAI has since joined Jenni AI – check that the GPT is still available.'),
 T('Zotero','zotero.org',3,4.8,12,'et',['literatur','publikation','querschnitt'],'Free and open source; browser connector and shared group libraries.'),
 T('Citavi','lumivero.com',3,5.0,2,'et',['literatur','publikation'],'References, knowledge organisation and task planning in one tool.'),
 T('EndNote','endnote.com',3,null,0,'et',['literatur','publikation'],'Comprehensive reference management with 7,000+ citation styles.'),
 T('Mendeley','mendeley.com',3,null,0,'et',['literatur','publikation'],'Free; automatic metadata capture and shared libraries.'),
 T('Paperpile','paperpile.com',3,null,0,'et',['literatur','publikation'],'Browser-based and tightly integrated with Google Docs.'),
 T('Scholar GPT',null,4,5.0,3,'gpt',['publikation','idee'],'Custom GPT: sharpen research questions and write in an academic register.'),
 T('QuillBot','quillbot.com',4,4.7,3,'ki',['publikation'],'Paraphrasing and grammar; double-check meaning and citations.'),
 T('DeepL Write','deepl.com/en/write',4,4.5,11,'ki',['publikation','transfer'],'Style, tone and grammar in several languages – widely used for academic text.'),
 T('Napkin AI','napkin.ai',4,4.0,1,'ki',['transfer','publikation'],'Turns text into diagrams, infographics and mind maps.'),
 T('Hemingway','hemingwayapp.com',4,3.5,2,'ki',['publikation'],'Readability analysis; file upload and AI features are subscription-only.'),
 T('Hesse AI','hesse.ai/en',4,3.0,2,'ki',['publikation'],'German provider, site defaults to German (English version available). Essay generation and flashcards; paid, with an academic-integrity risk.'),
 T('Abstract Generator',null,4,null,0,'gpt',['publikation'],'Custom GPT: structured abstracts from aim, method and results.'),
 T('Jenni AI','jenni.ai',4,null,0,'ki',['publikation'],'Autocomplete, outlining and automatic citation.'),
 T('Paperpal','paperpal.com',4,null,0,'ki',['publikation'],'Academic language editing and a submission-readiness check.'),
 T('Mimir Mentor','mimir-mentor.com/en/',4,null,0,'ki',['publikation','literatur'],'German provider, site defaults to German (English version available). Search, text generation and correction for academic work.'),
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
 T('Statistik GPT',null,6,5.0,3,'gpt',['analyse','design'],'Custom GPT (German-language): choosing methods, explaining them and writing up results.'),
 T('Jamovi','jamovi.org',6,5.0,1,'et',['analyse'],'Free; shows the underlying R code.'),
 T('Statistic & Data Analyst',null,6,4.0,2,'gpt',['analyse'],'Custom GPT: test selection, explaining R/Python/SPSS, methods section.'),
 T('JASP','jasp-stats.org',6,null,0,'et',['analyse'],'Frequentist and Bayesian analyses with APA-style tables.'),
 T('Arena (formerly LMArena)','arena.ai',7,5.0,2,'ki',['querschnitt'],'Blind comparison of language models – guidance for choosing a model.'),
 T('Obsidian','obsidian.md',7,5.0,2,'et',['querschnitt','literatur'],'Local, linked knowledge management with Zotero integration.'),
 T('Notion','notion.com',7,4.3,6,'et',['querschnitt'],'Project and literature organisation with AI features.'),
 T('Gemini Notebook (formerly NotebookLM)','notebook.google',7,4.3,10,'ki',['literatur','querschnitt','transfer'],'Google’s NotebookLM, now called Gemini Notebook: ask questions of your own sources; audio overviews and flashcards.'),
 T('STORM','storm.genie.stanford.edu',7,null,0,'ki',['idee','publikation'],'Researches automatically and produces an outline with citations.'),
 T('PopAI','popai.pro',7,null,0,'ki',['querschnitt'],'All-in-one platform; check subscription terms carefully.'),
 T('Litmaps','litmaps.com',0,null,0,'ki',['literatur','idee'],'Citation maps that grow from seed papers and track new publications.'),
 T('ASReview','asreview.nl',2,null,0,'ki',['literatur'],'Open-source active-learning screening for systematic reviews.'),
 T('Rayyan','rayyan.ai',2,null,0,'ki',['literatur'],'Collaborative screening for systematic reviews with AI-assisted prioritisation.'),
 T('Covidence','covidence.org',2,null,0,'et',['literatur'],'Systematic review management: screening, extraction and appraisal; often licensed by universities.'),
 T('scite','scite.ai',2,null,0,'ki',['literatur','publikation'],'Shows whether citing papers support or contrast a finding.'),
 T('Transkribus','transkribus.org',5,null,0,'ki',['erhebung'],'Handwritten text recognition (HTR) for historical documents.'),
 T('Overleaf','overleaf.com',4,null,0,'et',['publikation'],'Collaborative LaTeX writing, common for theses in STEM subjects.'),
 T('GitHub Copilot','github.com/features/copilot',7,null,0,'ki',['analyse'],'AI coding assistant in the code editor; in VS Code it can also run local MCP servers. Education offers are available.'),
 T('GitHub (repositories)','github.com',7,null,0,'et',['analyse','querschnitt'],'Hosting for code, data and documentation; via its MCP server or Copilot connector an agent can read repositories, issues and pull requests.'),
 T('OpenAlex','openalex.org',0,null,0,'et',['literatur','idee','publikation'],'Free, open catalogue of scholarly works, authors, sources and institutions; its MCP server can also check whether references exist.')
];

// MCP servers per tool (checked 2 November 2026): [o = official / c = community, remote server (1 = can be added in Copilot Studio, 0 = runs locally only), source, note]
const MCP = {
 'OpenAlex':['o',1,'https://help.openalex.org/access/connector/','Run by OpenAlex; sign-in, free daily allowance; can also check whether references exist.'],
 'draw.io':['o',1,'https://www.drawio.com/mcp/','Run by draw.io; hosted server, no install; also reads Mermaid and draw.io XML.'],
 'Figma':['o',1,'https://developers.figma.com/docs/figma-mcp-server/','Run by Figma; remote server with sign-in; writing to FigJam and Figma files, call limits depend on the Figma plan.'],
 'Paper Search MCP':['c',0,'https://github.com/openags/paper-search-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Searches several open sources at once (e.g. OpenAlex, Crossref, Semantic Scholar).'],
 'Semantic Scholar':['o',1,'https://allenai.org/asta/resources/mcp','Ai2 Asta server on the Semantic Scholar corpus; API key optional.'],
 'Elicit':['o',1,'https://support.elicit.com/en/articles/14757404-use-elicit-via-mcp-server','Sign-in with your account; Pro plan or higher.'],
 'Perplexity':['o',1,'https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server','Hosted server with sign-in or API key, or local; uses the paid Perplexity API.'],
 'Consensus':['o',1,'https://docs.consensus.app/consensus-mcp','Sign-in; small free monthly allowance.'],
 'DeepL Write':['o',1,'https://developers.deepl.com/docs/mcp','Remote with sign-in or local with API key; rephrasing needs Write.'],
 'Napkin AI':['o',1,'https://api.napkin.ai/faq/index.html','Beta; sign-in, uses Napkin credits.'],
 'Litmaps':['o',1,'https://docs.litmaps.com/en/articles/17508256-use-litmaps-with-your-ai-assistant-mcp','Beta; reads and edits your maps.'],
 'scite':['o',1,'https://scite.ai/mcp','Sign-in; paid plan or trial.'],
 'Sally AI':['o',1,'https://www.sally.io/api-integration/claude','Read-only access to meetings; admin must enable it.'],
 'Otter.ai':['o',1,'https://help.otter.ai/hc/en-us/articles/35287607569687-Otter-MCP-Server','Sign-in; search and fetch your transcripts.'],
 'Notion':['o',1,'https://developers.notion.com/guides/mcp/overview','Remote with sign-in, or local with a token.'],
 'GitHub (repositories)':['o',1,'https://github.com/github/github-mcp-server','GitHub’s official server for repositories, issues and pull requests; hosted or local.'],
 'JASP':['o',0,'https://github.com/jasp-stats/jasp-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Early stage; JASP must be running with its remote RPC server enabled.'],
 'Zotero':['c',0,'https://github.com/54yyyu/zotero-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Reads your local Zotero library or uses the Zotero web API.'],
 'EndNote':['c',0,'https://github.com/gokmengokhan/endnote-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Works on an XML export of your library.'],
 'Mendeley':['c',0,'https://github.com/pallaprolus/mendeley-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Uses the Mendeley API; register your own app.'],
 'Google Scholar':['c',0,'https://github.com/JackKuo666/Google-Scholar-MCP-Server','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. No official API – scrapes results; may break.'],
 'Whisper (OpenAI)':['c',0,'https://github.com/kachiO/mlx-whisper-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Apple Silicon Macs only; not updated since June 2025. Audio stays on your machine.'],
 'Jamovi':['c',0,'https://github.com/yjm110517/jamovi-mcp','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Controls a local jamovi installation.'],
 'Obsidian':['c',0,'https://github.com/MarkusPfundstein/mcp-obsidian','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Needs the Local REST API plugin.'],
 'Transkribus':['c',0,'https://github.com/lazyants/transkribus-mcp-server','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Needs your Transkribus credentials.'],
 'Overleaf':['c',0,'https://github.com/mjyoo2/OverleafMCP','Runs locally – e.g. GitHub Copilot in VS Code or a desktop assistant. Via Overleaf’s Git integration (paid plans).']
};

// Open-source agent skills and packages named in the use-case details: key -> [label, url, type]
// type is exactly 'Agent skill' only for folders with a SKILL.md (checked 2 November 2026); everything else names what it is
const KD = 'https://github.com/K-Dense-AI/scientific-agent-skills/tree/main/skills/';
const REPOS = {
 'ars-deep-research':['academic-research-skills · deep-research','https://github.com/Imbad0202/academic-research-skills/tree/main/deep-research','Agent skill'],
 'ars-paper':['academic-research-skills · academic-paper','https://github.com/Imbad0202/academic-research-skills/tree/main/academic-paper','Agent skill'],
 'ars-reviewer':['academic-research-skills · paper reviewer','https://github.com/Imbad0202/academic-research-skills/tree/main/academic-paper-reviewer','Agent skill'],
 'ars-screener':['academic-research-skills · sr-screener','https://github.com/Imbad0202/academic-research-skills/tree/main/sr-screener','Agent skill'],
 'kd-literature-review':['scientific-agent-skills · literature-review',KD+'literature-review','Agent skill'],
 'kd-peer-review':['scientific-agent-skills · peer-review',KD+'peer-review','Agent skill'],
 'kd-writing':['scientific-agent-skills · scientific-writing',KD+'scientific-writing','Agent skill'],
 'kd-stats':['scientific-agent-skills · statistical-analysis',KD+'statistical-analysis','Agent skill'],
 'kd-power':['scientific-agent-skills · statistical-power',KD+'statistical-power','Agent skill'],
 'kd-hypothesis':['scientific-agent-skills · hypothesis-generation',KD+'hypothesis-generation','Agent skill'],
 'kd-citation':['scientific-agent-skills · citation-management',KD+'citation-management','Agent skill'],
 'kd-viz':['scientific-agent-skills · scientific-visualization',KD+'scientific-visualization','Agent skill'],
 'kd-eda':['scientific-agent-skills · exploratory-data-analysis',KD+'exploratory-data-analysis','Agent skill'],
 'slr-prisma':['slr-prisma','https://github.com/keemanxp/slr-prisma','Agent skill'],
 'prisma2020':['PRISMA2020 flow diagram','https://github.com/prisma-flowdiagram/PRISMA2020','R package and Shiny web app (not an agent skill)'],
 'peer-review-panel':['ai-peer-review-skill','https://github.com/AlexWortega/ai-peer-review-skill','Agent skill'],
 'seminr':['SEMinR','https://github.com/sem-in-r/seminr','R package for structural equation modelling, PLS-SEM and CB-SEM (not an agent skill)'],
 'lavaan':['lavaan','https://github.com/yrosseel/lavaan','R package for structural equation modelling (not an agent skill)'],
 'metafor':['metafor','https://github.com/wviechtb/metafor','R package for meta-analysis (not an agent skill)'],
 'truman':['Truman platform','https://github.com/cornellsml/truman','Open-source mock social network for experiments (software, not an agent skill)'],
 'mock-social-media':['Mock Social Media Website Tool','https://docs.studysocial.media','Open-source research tool for mock feeds (software, not an agent skill)'],
 'awesome-copilot':['awesome-copilot','https://github.com/github/awesome-copilot','Community collection of instructions, agents and skills for GitHub Copilot (a collection, not a single skill)']
};
// Four levels of working with Copilot in Step 2
const LEVELS = [
 ['Chat', 'One conversation: prompt, pasted text or uploaded files. Copilot reads PDFs, Word, Excel, CSV and images and runs Python on data – not R, Stata or SPSS: it writes that code, you run it in your own software.'],
 ['Notebook / Cowork', 'A Copilot notebook keeps your files, notes and Copilot’s answers together – for work you return to. Copilot answers only from the files you add: no web, no Python, no CSV (save as .xlsx). Copilot Cowork works through a multi-step task across your files and apps and asks before sensitive steps – it needs a Microsoft 365 Copilot licence and your IT team.'],
 ['Agent', 'Your own agent in Agent Builder: standing instructions, knowledge and skills. Reusable for every new paper, dataset or draft. Files as knowledge need a Microsoft 365 Copilot licence – without one, attach them in the chat with your agent.'],
 ['Copilot Studio / GitHub Code', 'For anything an agent cannot hold: connecting tools and databases via MCP or connectors – e.g. OpenAlex, scite, GitHub – in Copilot Studio or as your own code on GitHub. Needs your IT team.']
];
const ROUTES = {chat:['Copilot Chat','A prompt and text you paste'], files:['Copilot + files','Upload your own or the practice files'],
 connected:['Copilot + connected tool','MCP server or Copilot connector – enabled by your IT'], external:['Specialist tool or open source','Academic extension or tool, R/Python package or agent skill']};

// Microsoft 365 integrations per tool (checked 2 November 2026): [type, source]
// copilot = Copilot connector or agent (needs a Microsoft 365 Copilot licence and IT approval)
// powerip = Power Automate connector from an independent publisher, not built by the tool's vendor
const M365 = {
 'Consensus':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/connectors-gallery-microsoft']],
 'scite':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/federated-connectors-overview']],
 'DeepL Write':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/connectors-gallery-microsoft'],['word','https://www.deepl.com/en/word-addin'],['power','https://learn.microsoft.com/en-us/connectors/deepl/'],['outlook','https://marketplace.microsoft.com/en-us/product/WA200006684']],
 'Notion':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/federated-connectors-overview'],['teams','https://www.notion.com/help/microsoft-teams-notifications'],['powerip','https://learn.microsoft.com/en-us/connectors/notionip/']],
 'GitHub (repositories)':[['copilot','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/github-cloud-knowledge-overview'],['teams','https://docs.github.com/en/integrations/how-tos/teams/integrate-github-with-teams'],['power','https://learn.microsoft.com/en-us/connectors/github/']],
 'Perplexity':[['word','https://marketplace.microsoft.com/en-us/product/WA200010847'],['teams','https://marketplace.microsoft.com/en-us/product/WA200010619'],['powerip','https://learn.microsoft.com/en-us/connectors/perplexityai/'],['outlook','https://marketplace.microsoft.com/en-us/product/WA200010911']],
 'Zotero':[['word','https://www.zotero.org/support/word_processor_plugin_usage'],['edge','https://microsoftedge.microsoft.com/addons/detail/nmhdhpibnnopknkmonacoephklnflpho']],
 'Citavi':[['word','https://marketplace.microsoft.com/en-us/product/WA200002891']],
 'EndNote':[['word','https://docs.endnote.com/docs/endnote/2025/v1/windows/en/content/09word/installing_cwywsprtinword.htm'],['edge','https://microsoftedge.microsoft.com/addons/detail/endnote-click/jaleebmaoohbjjohjlfmihkkopgfibne']],
 'Mendeley':[['word','https://marketplace.microsoft.com/en-us/product/wa104382081'],['edge','https://microsoftedge.microsoft.com/addons/detail/mendeley-web-importer/mbcgpelmjnpfbdnkbebdlfjmeckpnhha']],
 'Paperpile':[['word','https://paperpile.com/word-plugin/']],
 'Paperpal':[['word','https://marketplace.microsoft.com/en-us/product/wa200001361']],
 'QuillBot':[['word','https://quillbot.com/word'],['edge','https://microsoftedge.microsoft.com/addons/detail/quillbot-ai-writing-and-/cphpplikchcioccedpjacdanfibnimmh']],
 'Google Scholar':[['edge','https://microsoftedge.microsoft.com/addons/detail/google-scholar-button/fciokoalnclhnonofghacdplgpafdcgl']],
 'Otter.ai':[['teams','https://otter.ai/integration/microsoft-teams'],['outlook','https://otter.ai/integration/microsoft-outlook'],['files','https://otter.ai/integration/microsoft-onedrive']],
 'Sally AI':[['teams','https://www.sally.io/api-integration/microsoft-teams'],['outlook','https://www.sally.io/api-integration/automation-zapier-make-power-automate']],
 'Whisper (OpenAI)':[['azure','https://learn.microsoft.com/en-us/azure/ai-services/speech-service/whisper-overview']]
};
const M365_TYPE = {copilot:'Copilot connector', word:'Word add-in', teams:'Teams', power:'Power Automate', powerip:'Power Automate (third-party connector)', outlook:'Outlook', files:'OneDrive / SharePoint', edge:'Edge extension', azure:'Azure AI Speech'};

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
// Use cases the pre-workshop survey asked for (survey tab, slide 8), with the participants' own words
const WISH = {
 'idee-1':['I also use AI to brainstorm ideas for my writing and critically evaluate my research ideas.','I would like AI to suggest ways forward when I encounter unfamiliar research questions'],
 'idee-4':['Literature bridging and evidence mapping'],
 'idee-5':['Literature bridging and evidence mapping'],
 'literatur-1':['When I start a new strand of my project, I spend weeks screening and summarising literature… I\'d like AI to help me map that literature quickly'],
 'literatur-3':['data extraction for systematic review. data analysis for stats. understanding stats.'],
 'literatur-5':['AI helps me make sense of very disorganised bodies of research.'],
 'literatur-6':['effectively translating foreign-language materials.','make the reading process more effective without relying on word-for-word translation'],
 'design-0':['help improve experimental design so I can obtain more meaningful data with fewer iterations'],
 'analyse-0':['data extraction for systematic review. data analysis for stats. understanding stats.'],
 'analyse-1':['I would like AI to help with coding during the data cleaning and processing.'],
 'analyse-4':['I would like AI to help me develop and check analysis code, identify which measured signals reveal degradation, and interpret the results.'],
 'analyse-6':['how generative AI can help with scientific coding, debugging and verifying numerical results','…while ensuring that its recommendations remain physically correct and properly verified.'],
 'analyse-8':['to double check what things I might have missed covering during data analysis'],
 'publikation-0':['Understanding complex literature on my project. To give structure to my writing.'],
 'publikation-1':['…taking something I have already drafted and refining it to better meet the requirements of the writing brief or specific format.'],
 'publikation-4':['what changes would you suggest for submission to conference/journal X'],
 'publikation-7':['ask AI to check my thesis writing from the examiner role (I created an agent to do this role)'],
 'publikation-8':['to be a second eye as I cite and to challenge my citations.'],
 'querschnitt-1':['A way to pass my lab notes to word, so it can make a report of what I have done in the month.'],
 'querschnitt-2':['To assist in the planning the schedule of my whole project.'],
 'querschnitt-6':['data extraction for systematic review. data analysis for stats. understanding stats.']
};
const AGENDA_DAY = '2026-11-04', TOOL_SLOT = 5, SURVEY_SLOT = 1;

/* Slides of Tom's sessions: assets/slides/tom/sNN.webp, exported from PowerPoint (hidden slides left out) */
const SLIDES = {title:'Wait, where does my data go? · Why did it say that? A common baseline for prompting', who:'Tom', n:31, dir:'assets/slides/tom/', pdf:'assets/slides/tom/tom-slides.pdf', pdfSize:3001861,
 start:{2:1, 3:11},
 prompts:[["The GCSE formula", "Act as a [Context].\nHelp me [Goal].\nUse [Source].\nGive me the result as [Expectations]."], ["Let Copilot remind you", "Remember that whenever my prompt is vague, remind me to use the GCSE framework: Goal, Context, Source, Expectations."], ["Two open-access papers · 1 Summarise one paper", "Summarise this paper’s methods and findings in 5 bullets."], ["Two open-access papers · 2 Compare both papers", "Compare the methods in these two papers. Cite the relevant sections."], ["Two open-access papers · 3 Limitations", "List the limitations the authors report. Flag any missing information."], ["Full example: from a broad interest to research directions", "I am at the early stage of developing a postgraduate research project. Help me turn my broad interest in how generative AI is changing the way university students learn into a small number of credible research directions that I could investigate.\n\nI am interested in the relationship between generative AI, student learning behaviours and independent learning in higher education. I haven't yet decided on a precise research question, methodology or theoretical framework. I want to explore the topic before narrowing it down, rather than jumping immediately to a finished research question. Treat me as the researcher. Your role is to help me explore and challenge my thinking, not to make the research decisions for me.\n\nFor this initial exploration, use the information I have provided above and your general knowledge to help me map the topic. Clearly distinguish between:\n1. ideas or hypotheses that need testing,\n2. established concepts or bodies of research that may be relevant, and\n3. claims for which I should seek supporting academic evidence.\nDo not invent citations or references. Where literature would be useful, suggest search concepts and keywords I could investigate through my university's academic databases rather than presenting unverified references as evidence.\n\nStructure your response in five parts:\n1. Identify 5 possible research directions within this broad topic.\n2. For each, explain why it could be interesting to investigate and what remains uncertain.\n3. Suggest 2 possible research questions for each direction.\n4. Identify useful keywords and search terms that could help me begin exploring the academic literature.\n5. Finish by asking me 5 challenging questions, one at a time, to help me decide which direction best fits my interests, research context and intended contribution.\nDo not select the “best” topic for me. Help me make that judgement myself."]]};
// Team: photo = path under assets/team/ once available
const TEAM = [
 {n:'Oliver', role:'Director of AI Europe', photo:'assets/team/oliver.webp'},
 {n:'Tom', role:'Advisory Director', photo:'assets/team/tom.webp'},
 {n:'Thomas', role:'Client Director', photo:'assets/team/thomas.webp'},
 {n:'Liam', role:'Client Director', photo:'assets/team/liam.webp'},
 {n:'Rachel', role:'Senior Marketing Manager', photo:'assets/team/rachel.webp'},
 {n:'Manuel', role:'Professor (Heilbronn University of Applied Sciences)', photo:'assets/team/manuel.webp'}
];

const GAINS = [['time','Saves time'],['quality','Better quality'],['new','New possibility'],['learn','I learn']];

const CLUSTERS = [
 {n:'Literature and research question', ph:['idee','literatur']},
 {n:'Data collection', ph:['design','erhebung']},
 {n:'Analysis', ph:['analyse']},
 {n:'Writing and publishing', ph:['publikation','transfer']},
 {n:'PhD toolkit', ph:['querschnitt']}
];

const SOURCES = [
 ['Microsoft Learn – Copilot Chat FAQ','https://learn.microsoft.com/en-us/copilot/faq'],
 ['Microsoft Learn – Copilot Chat overview','https://learn.microsoft.com/en-us/copilot/overview'],
 ['Microsoft Learn – Privacy and protections in Copilot Chat','https://learn.microsoft.com/en-us/copilot/privacy-and-protections'],
  ['Microsoft Learn – Connect an agent to an existing MCP server (Copilot Studio)','https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent'],
 ['Microsoft Learn – Publish an agent to Teams and Microsoft 365 Copilot','https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams'],
 ['Microsoft Learn – Federated Copilot connectors','https://learn.microsoft.com/en-us/microsoft-365/copilot/connectors/federated-connectors-overview'],
 ['Microsoft Learn – Purchase and manage agents in Copilot Chat','https://learn.microsoft.com/en-us/copilot/manage-agents-copilot-chat']
];
const VERSION = 'v6 · 2 November 2026';
