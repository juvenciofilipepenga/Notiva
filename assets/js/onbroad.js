document.addEventListener("DOMContentLoaded", () => {
  const onboardingModal = document.getElementById("onboardingModal");
  const stepContainer = document.getElementById("onboardingStep");
  const progressRadios = document.querySelectorAll(".onboarding-progress input");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");

  // =========================
  // Inicialização global do tema
  // =========================
  const savedTheme = localStorage.getItem("notivaTheme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // =========================
  // Dados do usuário
  // =========================
  let userData = {
    name: localStorage.getItem("userName") || "",
    type: localStorage.getItem("userMode") || "",
    theme: savedTheme,
    profile: JSON.parse(localStorage.getItem("userProfile") || "{}"),
    termsAccepted: false,
    termsScrolled: false
  };

  let currentStep = 0;

  const steps = [
    { id: "welcome", title: "Bem-vindo ao Notiva", icon: "smartphone", content: "<p>Vamos configurar sua experiência rapidamente.</p>" },
    { id: "terms", title: "Termos de Uso", icon: "file-text", content: `
      <div class="terms-wrapper">
        <div class="scroll-box" id="termsScroll">
          <p>Bem-vindo ao Notiva. Continue lendo até o final...</p>
        </div>
        <label class="terms-label">
          <input type="checkbox" id="acceptTerms" disabled> Li e concordo com os termos
        </label>
        <div class="error-msg" id="termsError" style="color:red;font-size:0.85rem;margin-top:5px;"></div>
      </div>
    ` },
    { id: "name", title: "Seu Nome", icon: "user", content: `
      <input type='text' id='onboardingNameInput' placeholder='Digite seu nome'>
      <div class="error-msg" id="nameError" style="color:red;font-size:0.85rem;margin-top:5px;"></div>
    ` },
    { id: "type", title: "Escolha o modo", icon: "users", content: `
      <div class="theme-buttons">
        <button class="type-btn" data-type="student">Estudante</button>
        <button class="type-btn" data-type="church">Igreja</button>
        <button class="type-btn" data-type="company">Negócio</button>
      </div>
      <div class="error-msg" id="typeError" style="color:red;font-size:0.85rem;margin-top:5px;"></div>
    ` },
    { id: "questions", title: "Perguntas Iniciais", icon: "edit3", content: "<div id='questionsContainer'></div>" },
    { id: "theme", title: "Tema do App", icon: "sun", content: `
      <div class="theme-buttons">
        <button class="theme-btn" data-theme="light">Claro</button>
        <button class="theme-btn" data-theme="dark">Escuro</button>
      </div>
      <div class="error-msg" id="themeError" style="color:red;font-size:0.85rem;margin-top:5px;"></div>
    ` },
    { id: "finalize", title: "Pronto!", icon: "checkcircle", content: `
      <div style="text-align:center;">
        <p>A configuração do <b>Notiva</b> está finalizada.</p>
        <div id="loader" class="spinner-circle" style="display:none; margin:20px auto;"></div>
      </div>
    ` }
  ];

  // =========================
  // Renderiza passo atual
  // =========================
  function renderStep() {
    const step = steps[currentStep];
    stepContainer.innerHTML = `
      <div class="step-header">
        <div class="step-icon"><i data-lucide="${step.icon}"></i></div>
        <h2>${step.title}</h2>
      </div>
      <div class="step-body">${step.content}</div>
    `;
    lucide.createIcons();

    // Prev/Next
    prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
    nextBtn.textContent = step.id === "finalize" ? "Concluir" : "Próximo";
    nextBtn.disabled = true;

if (step.id === "welcome") {
  nextBtn.disabled = false;
}

    // Atualiza progresso
    progressRadios.forEach((radio, index) => {
      radio.checked = index <= currentStep;
    });

    // Configura passo específico
    if (step.id === "terms") setupTerms();
    if (step.id === "name") setupName();
    if (step.id === "type") setupType();
    if (step.id === "questions") renderQuestions();
    if (step.id === "theme") setupTheme();
    if (step.id === "finalize") setupFinalize();
  }

  // =========================
  // Navegação
  // =========================
  nextBtn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) { currentStep++; renderStep(); }
  });
  prevBtn.addEventListener("click", () => {
    if (currentStep > 0) { currentStep--; renderStep(); }
  });

  // =========================
  // Funções dos passos
  // =========================

  function setupTerms() {
    const scrollBox = document.getElementById("termsScroll");
    const checkbox = document.getElementById("acceptTerms");
    const errorDiv = document.getElementById("termsError");

    const updateState = () => {
      const reachedBottom = scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 5;
      userData.termsScrolled = reachedBottom;
      checkbox.disabled = !reachedBottom;
      errorDiv.textContent = reachedBottom ? "" : "Leia todos os termos antes de prosseguir.";
      validateStep();
    };

    scrollBox.addEventListener("scroll", updateState);
    updateState(); // verifica ao carregar

    checkbox.checked = userData.termsAccepted;
    checkbox.addEventListener("change", () => {
      userData.termsAccepted = checkbox.checked;
      errorDiv.textContent = checkbox.checked ? "" : "Você deve aceitar os termos.";
      validateStep();
    });
  }

  function setupName() {
  const input = document.getElementById("onboardingNameInput");
  const errorDiv = document.getElementById("nameError");

  input.value = userData.name;

  function validateFullName(value) {
    const trimmed = value.trim();

    if (!trimmed) return "O nome não pode ser vazio.";

    // Apenas letras e espaços (com acentos)
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(trimmed))
      return "Use apenas letras (sem números ou símbolos).";

    const words = trimmed.split(/\s+/);

    // Precisa ter pelo menos 2 palavras
    if (words.length < 2)
      return "Digite nome e apelido.";

    // Cada palavra deve ter no mínimo 2 letras
    for (let word of words) {
      if (word.length < 2)
        return "Cada nome deve ter pelo menos 2 letras.";
    }

    // Evita nomes repetidos tipo "aaa aaa"
    if (new Set(words.map(w => w.toLowerCase())).size === 1)
      return "Nome e apelido não podem ser iguais.";

    return "";
  }

  input.addEventListener("input", () => {
    const value = input.value;

    const errorMsg = validateFullName(value);

    errorDiv.textContent = errorMsg;

    if (!errorMsg) {
      userData.name = value.trim();
    }

    validateStep();
  });

  validateStep();
}
  function setupType() {
    const errorDiv = document.getElementById("typeError");
    document.querySelectorAll(".type-btn").forEach(btn => {
      btn.classList.toggle("active", userData.type === btn.dataset.type);
      btn.addEventListener("click", () => {
        document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        userData.type = btn.dataset.type;
        errorDiv.textContent = "";
        validateStep();
      });
    });
    validateStep();
  }

  function renderQuestions() {
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";
  
  let questionConfig;
  
  switch (userData.type) {
    case "student":
      questionConfig = {
        id: "studyPurpose",
        question: "Qual é seu principal objetivo no Notiva?",
        options: ["Organizar matérias", "Guardar PDFs", "Planejar estudos", "Outro"]
      };
      break;
      
    case "company":
      questionConfig = {
        id: "businessPurpose",
        question: "Como pretende usar o Notiva?",
        options: ["Gerenciar tarefas", "Controlar equipe", "Registrar clientes", "Outro"]
      };
      break;
      
    case "church":
      questionConfig = {
        id: "churchPurpose",
        question: "Qual o principal uso?",
        options: ["Organizar cultos", "Registrar membros", "Planejar eventos", "Outro"]
      };
      break;
      
    default:
      questionConfig = {
        id: "usagePurpose",
        question: "Como pretende usar o Notiva?",
        options: ["Organização pessoal", "Estudos", "Negócios", "Outro"]
      };
  }
  
  container.innerHTML = `
    <div class="question-block">
      <label>${questionConfig.question}</label>
      <div class="option-group">
        ${questionConfig.options.map(opt => `
          <button type="button" class="option-btn" data-value="${opt}">
            ${opt}
          </button>
        `).join("")}
      </div>

      <div id="otherContainer" style="display:none; margin-top:10px;">
        <input type="text" id="otherInput" placeholder="Descreva detalhadamente...">
        <div class="error-msg" id="otherError" style="color:red;font-size:0.85rem;margin-top:3px;"></div>
      </div>
    </div>
  `;
  
  const buttons = container.querySelectorAll(".option-btn");
  const otherContainer = document.getElementById("otherContainer");
  
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const value = btn.dataset.value;
      
      if (value === "Outro") {
        otherContainer.style.display = "block";
        userData.profile[questionConfig.id] = "";
      } else {
        otherContainer.style.display = "none";
        userData.profile[questionConfig.id] = value;
      }
      
      validateStep();
    });
  });
  
  const otherInput = document.getElementById("otherInput");
  otherInput?.addEventListener("input", () => {
    const value = otherInput.value.trim();
    const errorDiv = document.getElementById("otherError");
    
    if (value.length < 5)
      errorDiv.textContent = "Descreva com pelo menos 5 caracteres.";
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/.test(value))
      errorDiv.textContent = "Não use símbolos especiais.";
    else {
      errorDiv.textContent = "";
      userData.profile[questionConfig.id] = value;
    }
    
    validateStep();
  });
  
  validateStep();
}

  function setupTheme() {
    document.querySelectorAll(".theme-btn").forEach(btn => {
      btn.classList.toggle("active", userData.theme === btn.dataset.theme);
      btn.addEventListener("click", () => {
        userData.theme = btn.dataset.theme;
        document.documentElement.setAttribute("data-theme", userData.theme);
        localStorage.setItem("notivaTheme", userData.theme);
        document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        validateStep();
      });
    });
    validateStep();
  }

  function setupFinalize() {
  nextBtn.textContent = "Concluir";
  nextBtn.disabled = false;
  
  // Remove qualquer listener antigo para evitar conflito
  const newNext = nextBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);
  
  newNext.onclick = () => {
    newNext.disabled = true;
    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "block";
    
    setTimeout(() => {
      if (loader) loader.style.display = "none";
      document.getElementById("onboardingModal").classList.add("hidden");
      saveUserData();
      document.querySelector(".app-container").style.display = "block";
    }, 1000);
  };
}
  // =========================
  // Validação geral
  // =========================
  function validateStep() {
    switch(steps[currentStep].id) {
      case "terms":
        const checkbox = document.getElementById("acceptTerms");
        nextBtn.disabled = !checkbox.checked || !userData.termsScrolled;
        break;
      case "name":
        const msg = document.getElementById("nameError").textContent;
        nextBtn.disabled = !!msg || !document.getElementById("onboardingNameInput").value.trim();
        break;
      case "type":
        nextBtn.disabled = !userData.type;
        break;
      case "questions":
const selected = document.querySelector(".option-btn.active");
if (!selected) {
  nextBtn.disabled = true;
  break;
}

if (selected.dataset.value === "Outro") {
  const otherInput = document.getElementById("otherInput");
  const error = document.getElementById("otherError").textContent;
  nextBtn.disabled = !otherInput.value.trim() || !!error;
} else {
  nextBtn.disabled = false;
}
break;
      case "theme":
        nextBtn.disabled = !userData.theme;
        break;
      default:
        nextBtn.disabled = false;
    }
  }

  // =========================
  // Salva dados
  // =========================
  function saveUserData() {
    localStorage.setItem("userName", userData.name);
    localStorage.setItem("userMode", userData.type);
    localStorage.setItem("notivaTheme", userData.theme);
    localStorage.setItem("userProfile", JSON.stringify(userData.profile));
    localStorage.setItem("onboardingDone", "true");
  }

  // =========================
  // Inicialização
  // =========================
  if (!localStorage.getItem("onboardingDone")) {
    onboardingModal.classList.remove("hidden");
    renderStep();
  }
});