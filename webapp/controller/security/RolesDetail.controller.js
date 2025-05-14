sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/base/Log",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (BaseController, JSONModel, Log, MessageToast, MessageBox) {
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

        try {
          const response = await fetch(`http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=users&roleid=${sRoleId}`,
         {method: "POST"});
          const result = await response.json();

          if (Array.isArray(result.value) && result.value.length > 0) {
            const fetchedData = result.value[0];
            const oData = oSelectedModel.getData();
            oData.USERS = fetchedData.USERS || [];
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
    },

    _handleRoleAction: async function (options) {
      const oModel = this.getView().getModel("selectedRole");
      const oData = oModel ? oModel.getData() : null;
      const that = this;

      if (!oData || !oData.ROLEID) {
        MessageToast.show("No se encontró el ROLEID.");
        return;
      }

      MessageBox[options.dialogType](
        options.message.replace("{ROLENAME}", oData.ROLENAME),
        {
          title: options.title,
          actions: options.actions,
          emphasizedAction: options.emphasizedAction,
          onClose: async function (oAction) {
            if (oAction === options.confirmAction) {
              try {
                const response = await fetch(`${options.url}${oData.ROLEID}`, {
                  method: options.method
                });

                const result = await response.json();

                if (result && !result.error) {
                  MessageToast.show(options.successMessage);
                  window.location.hash = "#/roles?refresh=true";


                } else {
                  MessageBox.error("Error: " + (result?.message || "desconocido"));
                }
              } catch (error) {
                MessageBox.error("Error en la petición: " + error.message);
              }
            }
          }
        }
      );
    },

    onDesactivateRole: function () {
      this._handleRoleAction({
        dialogType: "confirm",
        message: "¿Estás seguro de que deseas desactivar el rol \"{ROLENAME}\"?",
        title: "Confirmar desactivación",
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        emphasizedAction: MessageBox.Action.YES,
        confirmAction: MessageBox.Action.YES,
        method: "POST",
        url: "http://localhost:4004/api/sec/rolesCRUD?procedure=delete&type=logic&roleid=",
        successMessage: "Rol desactivado correctamente."
      });
    },

    onDeleteRole: function () {
      this._handleRoleAction({
        dialogType: "warning",
        message: "¿Estás seguro de que deseas eliminar el rol \"{ROLENAME}\" permanentemente? Esta acción no se puede deshacer.",
        title: "Confirmar eliminación permanente",
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        confirmAction: MessageBox.Action.DELETE,
        method: "POST",
        url: "http://localhost:4004/api/sec/rolesCRUD?procedure=delete&type=hard&roleid=",
        successMessage: "Rol eliminado permanentemente."
      });
    }
  });
});
