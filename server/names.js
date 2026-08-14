const EMPLOYEE_MAP = {
  "AARON": [
    {"fullName":"Aaron Handelman","title":"Enterprise Customer Success Manager"},
    {"fullName":"Aaron Mullenix","title":"Senior Recruiter"}
  ],
  "ADAM": [
    {"fullName":"Adam Franks","title":""},
    {"fullName":"Adam Leshaw","title":"Enterprise Account Executive"}
  ],
  "AFSANA": [
    {"fullName":"Afsana Jahan","title":"Account Executive"}
  ],
  "AIDAN": [
    {"fullName":"Aidan Harbison","title":"Software Engineer"}
  ],
  "AKHIL": [
    {"fullName":"Akhil Sukhthankar","title":"Software Engineer on Post-Submission"}
  ],
  "ALAN": [
    {"fullName":"Alan Murphy","title":"Senior Recruiter"}
  ],
  "ALBERT": [
    {"fullName":"Albert Chalom","title":"Software Engineer"}
  ],
  "ALEX": [
    {"fullName":"Alex Cion","title":"Director of Strategic Initiatives"},
    {"fullName":"Alex Crawford","title":"Enterprise Account Executive"},
    {"fullName":"Alex Fabian","title":"Engineering Manager"},
    {"fullName":"Alex Jay","title":"Operations Assistant"},
    {"fullName":"Alex Longerbeam","title":"Engineering Manager - Permitting Success"},
    {"fullName":"Alex Tlalka","title":"alex.tlalka@permitflow.com"}
  ],
  "ALEXANDER": [
    {"fullName":"Alexander Manes","title":"Product Manager"}
  ],
  "ALYSSA": [
    {"fullName":"Alyssa Tuman","title":"VP of Customer Success"}
  ],
  "AMBER": [
    {"fullName":"Amber Godil","title":""}
  ],
  "AMMAR": [
    {"fullName":"Ammar Syed","title":"Operations Lead"}
  ],
  "ANANT": [
    {"fullName":"Anant Kumar","title":"Enterprise Implementation Manager"}
  ],
  "ANASTASIIA": [
    {"fullName":"Anastasiia Tkachenko","title":"Operations Lead"}
  ],
  "ANDRES": [
    {"fullName":"Andres Campos","title":"Operations Lead"}
  ],
  "ANDREW": [
    {"fullName":"Andrew Chang","title":"Software Engineer"}
  ],
  "ANGEL": [
    {"fullName":"Angel To","title":"Customer Success Manager"}
  ],
  "ANGIE": [
    {"fullName":"Angie Mora","title":"Analytics Engineer"}
  ],
  "ASHISH": [
    {"fullName":"Ashish Giri","title":"Operations Manager"}
  ],
  "BEN": [
    {"fullName":"Ben Fortgang","title":"Account Executive"},
    {"fullName":"Ben Leibowitz","title":"Engineering Manager - Platform"}
  ],
  "BETH": [
    {"fullName":"Beth Brichetto","title":"Operations Manager"}
  ],
  "BILL": [
    {"fullName":"Bill Finn","title":"Enterprise CSM"}
  ],
  "BILLY": [
    {"fullName":"Billy Wang","title":""}
  ],
  "BRAD": [
    {"fullName":"Brad DeLandro","title":"Operations Lead"}
  ],
  "BREANNA": [
    {"fullName":"Breanna Andree-Couturier","title":"Operations Lead"}
  ],
  "BRENDAN": [
    {"fullName":"Brendan Kenny","title":"Business Development Representative"}
  ],
  "BRETT": [
    {"fullName":"Brett Silverman","title":""}
  ],
  "BRIANNA": [
    {"fullName":"Brianna Rodriguez","title":"Permit Ops Lead"}
  ],
  "BRIDGET": [
    {"fullName":"Bridget O'Meara","title":"Operations Lead"}
  ],
  "BRITAIN": [
    {"fullName":"Britain Jacobson","title":"Head of Operations Strategy"}
  ],
  "CARLTON": [
    {"fullName":"Carlton Downie","title":"Software Engineer"}
  ],
  "CARLY": [
    {"fullName":"Carly Shabo","title":"Operations Lead"}
  ],
  "CHRIS": [
    {"fullName":"Chris Jeon","title":"Software Engineer"}
  ],
  "CHRISTIANE": [
    {"fullName":"Christiane Taylor","title":"Operations Lead"}
  ],
  "CHRISTOPHER": [
    {"fullName":"Christopher Ferreira","title":""},
    {"fullName":"Christopher Tan","title":""}
  ],
  "COLLINS": [
    {"fullName":"Collins Chikeluba","title":"SWE @ Intelligence & Submissions"}
  ],
  "CYNTHIA": [
    {"fullName":"Cynthia Fang","title":"Analytics Engineer"}
  ],
  "DALE": [
    {"fullName":"Dale Pittner","title":"Operations Lead"}
  ],
  "DANNY": [
    {"fullName":"Danny Gothelf","title":"\"VP"}
  ],
  "DAVID": [
    {"fullName":"David Froneberger","title":""}
  ],
  "DEAN": [
    {"fullName":"Dean Itani","title":"Head of Business Operations and Finance"}
  ],
  "DOMINIQUE": [
    {"fullName":"Dominique Wimmer","title":"Product Manager"}
  ],
  "DUN": [
    {"fullName":"Dun Hanthip","title":"Senior Recruiter"}
  ],
  "EDEN": [
    {"fullName":"Eden Lee","title":"CSM"}
  ],
  "EGLE": [
    {"fullName":"Egle Thompson","title":"Sales Engineer"}
  ],
  "EJAZ": [
    {"fullName":"Ejaz Farook","title":"Operations Manager"}
  ],
  "ELLIOT": [
    {"fullName":"Elliot Wentzel","title":"Strategic Business Development Representative"}
  ],
  "EMILEE": [
    {"fullName":"Emilee McLavish","title":"Operations Lead"}
  ],
  "ERIC": [
    {"fullName":"Eric Strauchen","title":"CSM"}
  ],
  "FIORELLA": [
    {"fullName":"Fiorella Bariani","title":"Head of People"}
  ],
  "FRANCIS": [
    {"fullName":"Francis Thumpasery","title":"Co-Founder and CEO"}
  ],
  "GILA": [
    {"fullName":"Gila Glazerson","title":"Revenue Enablement Manager"}
  ],
  "GLENN": [
    {"fullName":"Glenn Volk","title":"Enterprise Customer Success Manager"}
  ],
  "GRACE": [
    {"fullName":"Grace Shambley","title":""}
  ],
  "GREGORY": [
    {"fullName":"Gregory Bowman","title":""}
  ],
  "HAYDEN": [
    {"fullName":"Hayden Abrevaya","title":""}
  ],
  "HEATHER": [
    {"fullName":"Heather Fogleman","title":""}
  ],
  "HENRY": [
    {"fullName":"Henry Lardy","title":"BizOps"}
  ],
  "ISAIAH": [
    {"fullName":"Isaiah Matthews","title":"Product Operations - Post Submission"}
  ],
  "JACK": [
    {"fullName":"Jack Koppa","title":"Software Engineer | Intelligence & Submission"},
    {"fullName":"Jack Nash","title":"Software Engineer"}
  ],
  "JACKSON": [
    {"fullName":"Jackson Corporation","title":"Operations Assistant"}
  ],
  "JACOB": [
    {"fullName":"Jacob Green","title":""}
  ],
  "JAKE": [
    {"fullName":"Jake Marshall","title":"People Operations Manager"},
    {"fullName":"Jake Mendys","title":"Solutions Consultant"}
  ],
  "JAMES": [
    {"fullName":"James Baillie","title":"Head of Product"}
  ],
  "JARED": [
    {"fullName":"Jared Schewe","title":"Operations Manager"}
  ],
  "JASON": [
    {"fullName":"Jason Lin","title":"Product Operations Manager"}
  ],
  "JAVID": [
    {"fullName":"Javid Lakha","title":"Machine Learning Engineer"}
  ],
  "JEEWOON": [
    {"fullName":"Jeewoon Lee","title":"Product Designer"}
  ],
  "JOEL": [
    {"fullName":"Joel Graber","title":"COO"}
  ],
  "JOHN": [
    {"fullName":"John Canelis","title":"Product Designer"},
    {"fullName":"John Sanchez","title":"Operations Lead"},
    {"fullName":"john guilford","title":"Enterprise Account Executive"}
  ],
  "JONATHAN": [
    {"fullName":"Jonathan Dresnick","title":"Enterprise Account Executive"}
  ],
  "JOSEPH": [
    {"fullName":"joseph Pham","title":""}
  ],
  "JUDY": [
    {"fullName":"Judy Rajas","title":"Operations Assistant"}
  ],
  "KABIR": [
    {"fullName":"Kabir Faiz","title":"Mid-Market Account Executive"}
  ],
  "KATIE": [
    {"fullName":"Katie Weinmann","title":"Permit Ops Lead"}
  ],
  "KENTA": [
    {"fullName":"Kenta Onimura","title":"Applied AI"}
  ],
  "KEVIN": [
    {"fullName":"Kevin Chen","title":"Product Manager"},
    {"fullName":"Kevin Qiu","title":""}
  ],
  "KHANH": [
    {"fullName":"Khanh Nguyen","title":"Software Engineer"}
  ],
  "KIMBERLY": [
    {"fullName":"Kimberly Dao","title":"Operations Lead"}
  ],
  "KOURTNEY": [
    {"fullName":"Kourtney Chima","title":"Intelligence & Submissions"}
  ],
  "KURT": [
    {"fullName":"Kurt Scherer","title":""}
  ],
  "LILY": [
    {"fullName":"Lily Shao","title":""}
  ],
  "LINDSAY": [
    {"fullName":"Lindsay Loson","title":"Senior Operations Lead"}
  ],
  "LINDSEY": [
    {"fullName":"Lindsey Martin","title":"Enterprise Account Executive"}
  ],
  "LYNDSAY": [
    {"fullName":"Lyndsay Arocho","title":"Account Executive"}
  ],
  "MADHURA": [
    {"fullName":"Madhura Naidu","title":"Customer Success Manager"}
  ],
  "MARIA": [
    {"fullName":"Maria Kim","title":"Senior Product OA"}
  ],
  "MARTINA": [
    {"fullName":"Martina Qua","title":"Customer Solutions Engineer"}
  ],
  "MATT": [
    {"fullName":"Matt Diesner","title":"Sales Director"},
    {"fullName":"Matt Kenask","title":"Account Executive"}
  ],
  "MATTHEW": [
    {"fullName":"Matthew Jordan","title":"Strategic Director of Operations"},
    {"fullName":"Matthew Roman","title":"Permit Operations Lead"}
  ],
  "MAYA": [
    {"fullName":"Maya Chelar","title":"SWE on Integrations"}
  ],
  "MEGAN": [
    {"fullName":"Megan Alger","title":"Operations Lead"},
    {"fullName":"Megan Milburn","title":"Operations Lead"},
    {"fullName":"Megan Park","title":"Product Designer"}
  ],
  "MEGHANN": [
    {"fullName":"Meghann Mingle","title":"Senior Operations Lead"}
  ],
  "MELISSA": [
    {"fullName":"Melissa McCall","title":"Operations Lead"}
  ],
  "MICHAEL": [
    {"fullName":"Michael Henry","title":"Operations Lead"},
    {"fullName":"Michael Stevens","title":"Platform Engineer"}
  ],
  "MOLLY": [
    {"fullName":"Molly Livingston","title":"Senior Technical Recruiter"}
  ],
  "MRINALINI": [
    {"fullName":"Mrinalini Singh","title":"ProdOps"}
  ],
  "NAEL": [
    {"fullName":"Nael Osseiran","title":"Enterprise Account Executive"}
  ],
  "NIK": [
    {"fullName":"Nik Milicic","title":"Operations Lead"}
  ],
  "NIKIL": [
    {"fullName":"Nikil Ramanathan","title":"Analytics Engineer"}
  ],
  "NIKKI": [
    {"fullName":"Nikki Goodridge","title":"Operations Lead"}
  ],
  "NOAH": [
    {"fullName":"Noah Katz","title":"Sales"},
    {"fullName":"Noah Witus","title":"Permit Operations Lead"}
  ],
  "OLIVIA": [
    {"fullName":"Olivia Haynes","title":"Operations Lead"}
  ],
  "OWEN": [
    {"fullName":"Owen Dayoub","title":"Customer Success Manager"}
  ],
  "PAUL": [
    {"fullName":"Paul Dejoras","title":"Operations Assistant"}
  ],
  "PRESTON": [
    {"fullName":"Preston Lyons","title":"Head of Enterprise Sales"}
  ],
  "RANTEG": [
    {"fullName":"Ranteg Sandhu","title":"Account Executive"}
  ],
  "RAYMOND": [
    {"fullName":"Raymond Hu","title":"Chief of Staff"}
  ],
  "RIAIN": [
    {"fullName":"Riain Condon","title":"Platform Engineer"}
  ],
  "RIFAT": [
    {"fullName":"Rifat Hossain","title":"Operations Lead"}
  ],
  "ROBBY": [
    {"fullName":"Robby Bieber","title":"SWE"}
  ],
  "RYAN": [
    {"fullName":"Ryan Brown","title":"Enterprise Customer Success Manager"},
    {"fullName":"Ryan Holland","title":"Pilot Operations Lead"},
    {"fullName":"Ryan VanElslander","title":"Enterprise Account Executive"}
  ],
  "SAM": [
    {"fullName":"Sam Lam","title":"Co-Founder & CTO"}
  ],
  "SCOTT": [
    {"fullName":"Scott Sanderson","title":"Customer Operations Lead"}
  ],
  "SEBASTIAN": [
    {"fullName":"Sebastian Mendieta","title":"Operations Lead"}
  ],
  "SHANNON": [
    {"fullName":"Shannon Kelly","title":"Recruiting"}
  ],
  "SHUBA": [
    {"fullName":"Shuba Prasadh","title":"Customer Solutions Engineer"}
  ],
  "SIMONE": [
    {"fullName":"Simone Johnson","title":"Operation Lead"}
  ],
  "SNEHA": [
    {"fullName":"Sneha Yarlagadda","title":"BizOps"}
  ],
  "STEVEN": [
    {"fullName":"Steven Cao","title":"Software Engineer"}
  ],
  "SYDNEY": [
    {"fullName":"Sydney Price","title":"Operations Lead"}
  ],
  "THOMAS": [
    {"fullName":"Thomas Frank","title":"CSM"}
  ],
  "TIM": [
    {"fullName":"Tim Keenan","title":"Account Executive"},
    {"fullName":"Tim Lew","title":""}
  ],
  "TY": [
    {"fullName":"Ty Currie","title":"Implementation Specialist"}
  ],
  "TYLER": [
    {"fullName":"Tyler Maynard","title":"Permit Operations Lead"},
    {"fullName":"Tyler Reynolds","title":"Operations Lead"}
  ],
  "UTSAV": [
    {"fullName":"Utsav Kaushish","title":"Head of Data and Analytics"}
  ],
  "VON": [
    {"fullName":"Von Hobe","title":"Strategic Business Development Representative"}
  ],
  "WILLIAM": [
    {"fullName":"William Lindsay","title":"Founding Software Engineer"}
  ],
  "YAHYA": [
    {"fullName":"yahya elgawady","title":"Software Engineer"}
  ],
  "ZAHRA": [
    {"fullName":"Zahra Kagalwalla","title":"Senior Recruiter"}
  ],
  "ZIKORA": [
    {"fullName":"Zikora Agbapu","title":""}
  ]
};
module.exports = { EMPLOYEE_MAP };