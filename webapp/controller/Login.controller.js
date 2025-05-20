sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("com.invertions.sapfiorimodinv.controller.Login", {
    onInit: function () {
      this.getView().setModel(new JSONModel({
        email: "",
        password: ""
      }), "loginModel");
    },

    onLoginPress: async function () {
  const oLogin = this.getView().getModel("loginModel").getData();

  try {
    const response = await fetch("http://localhost:4004/api/sec/usersCRUD?procedure=getall", {
      method: "POST"
    });

    const result = await response.json();
    const userList = Array.isArray(result.value) ? result.value : [];

    console.log("📥 Email ingresado:", oLogin.email);
    console.log("📥 Alias ingresado:", oLogin.password);

    const user = userList.find(u =>
      (u.EMAIL || "").trim().toLowerCase() === oLogin.email.trim().toLowerCase() &&
      (u.ALIAS || "").trim().toLowerCase() === oLogin.password.trim().toLowerCase()
    );

    if (!user) {
      MessageToast.show("Usuario o alias incorrecto");
      return;
    }

    // 👉 Construye el texto de privilegios si existen
    const privileges = user.ROLES?.flatMap(role =>
      role.PROCESSES?.flatMap(proc =>
        proc.PRIVILEGES?.map(p => `${proc.PROCESSNAME}: ${p.PRIVILEGENAME}`)
      )
    ) || [];

    user._privilegesText = privileges.length > 0
      ? `🔐 Privilegios:\n- ${privileges.join("\n- ")}`
      : "🔐 Sin privilegios asignados.";

    // 👉 Guarda el usuario en el modelo global appView
    const oAppModel = this.getOwnerComponent().getModel("appView");
    oAppModel.setProperty("/isLoggedIn", true);
    oAppModel.setProperty("/currentUser", user);

    console.log("✅ Usuario autenticado y guardado:", user);

    // 👉 Navega a la vista principal (Main) después de guardar
    this.getOwnerComponent().getRouter().navTo("RouteMain");

  } catch (error) {
    console.error("❌ Error al autenticar:", error);
    MessageToast.show("Error al conectar con la API");
  }
}


,

    onVerContraseña: function () {
      const oInput = this.byId("passwordInput");
      const bCurrentType = oInput.getType() === "Text";
      oInput.setType(bCurrentType ? "Password" : "Text");
      this.byId("showPasswordButton").setIcon(bCurrentType ? "sap-icon://show" : "sap-icon://hide");
    }
  });
});
