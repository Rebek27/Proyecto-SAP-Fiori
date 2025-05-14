/* eslint-disable linebreak-style */
/* eslint-disable no-console */
sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(BaseController,JSONModel,Log,Fragment,MessageToast,MessageBox){
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.UserDetails",{
        onInit: function(){
			const oRouter = this.getRouter();

			oRouter.getRoute("RouteUserDetails").attachPatternMatched(this._onRouteMatched,this);
        },
		_onRouteMatched: async function(oEvent){
			const sUserId = oEvent.getParameter("arguments").USERID;
			console.log("sUserID",sUserId);
			const oSelectedUser = this.getOwnerComponent().getModel("selectedUser");

			if (!oSelectedUser) {
				Log.error("No hay modelo 'selectedUser'.");
				return;
			}

			const oData = oSelectedUser.getData();
			
			if(oData && oData.USERID === sUserId){
				this.getView().setModel(oSelectedUser, "selectedUser");
				this.getView().bindElement({ path: "/", model: "selectedUser" });
				console.log(this.getView().getModel("selectedUser").getData());
			}else{
				Log.warning("El Usuario seleccionado no coincide con el ID Recibido");
			}
		},

		onEditUser: function(){
			 // Obtenemos los datos del usuario seleccionado
			var oSelectedUser = this.getView().getModel("selectedUser").getData();
			// Realizamos una copia profunda para evitar que los cambios se apliquen directamente en el modelo global
			var oSelectedUserCopy = JSON.parse(JSON.stringify(oSelectedUser));
			if (!this._oUserDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.invertions.sapfiorimodinv.view.security.UserDialog",
                    controller: this
                }).then( (oDialog) => {
                    this.getView().addDependent(oDialog);
                    this._oUserDialog = oDialog;
                    // Creamos un modelo local basado en el usuario seleccionado
            		var oDialogModel = new JSONModel(oSelectedUserCopy);
                    oDialogModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                    oDialog.setModel(oDialogModel, "UserDialogModel");
                    oDialog.open();
                }).catch((err) => {
					console.error(err);
				});
            } else {
                // Si el diálogo ya existe, actualizamos su modelo local con la copia de los datos seleccionados
				var oDialogModel = new JSONModel(oSelectedUserCopy);
				oDialogModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this._oUserDialog.setModel(oDialogModel, "UserDialogModel");
				this._oUserDialog.open();
            }
		},

		onCancelUser: function(){
            if (this._oUserDialog) {
                this._oUserDialog.close();
            }
        },

		_handleUserAction: async function (options) {
		const oModel = this.getView().getModel("selectedUser");
		const oData = oModel ? oModel.getData() : null;
		const that = this;

		if (!oData || !oData.USERID) {
			MessageToast.show("No se encontró el USERID.");
			return;
		}

		MessageBox[options.dialogType](
			options.message.replace("{USERNAME}", oData.USERNAME),
			{
			title: options.title,
			actions: options.actions,
			emphasizedAction: options.emphasizedAction,
			onClose: async function (oAction) {
				if (oAction === options.confirmAction) {
				try {
					const response = await fetch(`${options.url}${oData.USERID}`, {
					method: options.method
					});

					const result = await response.json();

					if (result && !result.error) {
					MessageToast.show(options.successMessage);
					window.location.hash = "#/users?refresh=true";


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
		onDeleteUser: function () {
			this._handleUserAction({
				dialogType: "warning",
				message: "¿Estás seguro de que deseas eliminar el Usuario \"{USERNAME}\" permanentemente? Esta acción no se puede deshacer.",
				title: "Confirmar eliminación permanente",
				actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.DELETE,
				confirmAction: MessageBox.Action.DELETE,
				method: "POST",
				url: "http://localhost:4004/api/sec/usersCRUD?procedure=delete&type=hard&userid=",
				successMessage: "Usuario eliminado permanentemente."
			});
		}


    });
});