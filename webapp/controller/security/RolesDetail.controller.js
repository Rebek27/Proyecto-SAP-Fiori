sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log"
  ], function (BaseController, JSONModel, Log) {
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.RolesDetail", {
      onInit: function () {
        const oRouter = this.getRouter();
        oRouter.getRoute("RouteRolesDetail").attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: async function (oEvent) {
        const sRoleId = oEvent.getParameter("arguments").roleId;
        const oSelectedModel = this.getOwnerComponent().getModel("selectedRole");

        if (!oSelectedModel) {
          Log.error("No hay modelo 'selectedRole'.");
          return;
        }

        const oData = oSelectedModel.getData();
        if (oData && oData.ROLEID === sRoleId) {
          this.getView().setModel(oSelectedModel, "selectedRole");
          this.getView().bindElement({ path: "/", model: "selectedRole" });

          // 🔹 Obtener los usuarios desde la API con el roleId
          try {
            const response = await fetch(`http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=users&roleid=${sRoleId}`);
            const result = await response.json();
          
            if (Array.isArray(result.value) && result.value.length > 0) {
              const fetchedData = result.value[0]; // Contiene ROLEID, ROLENAME, DESCRIPTION, USERS
          
              // 🔹 Mantén los datos actuales del modelo y solo añade/actualiza USERS
              const oData = oSelectedModel.getData();
              oData.USERS = fetchedData.USERS || [];
          
              // 🔹 Actualiza el modelo con el objeto combinado
              oSelectedModel.setData(oData);
            } else {
              Log.warning("No se encontró información para el rol con ID: " + sRoleId);
            }
          } catch (error) {
            Log.error("Error al obtener usuarios del rol", error);
          }
          
          
        } else {
          Log.warning("El rol seleccionado no coincide con el roleId recibido.");
        }
      },

      onNavBack: function () {
        const oHistory = sap.ui.core.routing.History.getInstance();
        const sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          this.getOwnerComponent().getRouter().navTo("RouteRolesMaster", {}, true);
        }
      }
    });
  });
