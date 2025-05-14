/* eslint-disable linebreak-style */
/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable fiori-custom/sap-no-localhost */
sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast"
], function(BaseController,JSONModel,Log,Fragment,MessageToast){
    "use strict";

    return BaseController.extend("com.invertions.sapfiorimodinv.controller.security.UsersList",{
        onInit: function(){
            const oRolesModel = new JSONModel();
            this.getView().setModel(oRolesModel, "users");

            const oSelectedUserModel = new JSONModel();

            this.getView().setModel(oSelectedUserModel, "selectedUser");

            this._loadUsersData();
        },

        _loadUsersData: async function(){
            try {
                const response = await fetch("http://localhost:4004/api/sec/usersCRUD?procedure=getall",{
                    method:"POST",
                    headers: {
                        "Content-Type": "application/json" // Indica que se envían datos en JSON
                    }
                });
                const data = await response.json();
                //console.log("ESTO ES LA RESPUESTA:",data);
                // Guardamos todo el array de usuarios
                this.getView().getModel("users").setData({ value: data.value });
              } catch (error) {
                Log.error("Error al cargar Usuarios", error);
              }
        },
        
        onListItemPressed:function(oEvent){
            const oListItem = oEvent.getParameter("listItem");
            const oContext = oListItem.getBindingContext("users");
            
            if (!oContext) {
                console.error("No se encontró el contexto del rol seleccionado.");
                return;
            }

            const oSelectedUser = oContext.getObject();
            
            const oSelectedUserModel = new JSONModel(oSelectedUser);
            this.getOwnerComponent().setModel(oSelectedUserModel, "selectedUser");
            
            //✅ Navegar al detalle
            this.getOwnerComponent().getRouter().navTo("RouteUserDetails", {
                USERID: encodeURIComponent(oSelectedUser.USERID)
            });
        },

        onAddUser : function() {
            if (!this._oUserDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.invertions.sapfiorimodinv.view.security.UserDialog",
                    controller: this
                }).then( (oDialog) => {
                    this.getView().addDependent(oDialog);
                    this._oUserDialog = oDialog;
                    // Crea y asigna un modelo local para el diálogo
                    var oDialogModel = new JSONModel({
                        USERID:"",
                        USERNAME:"",
                        FIRSTNAME: "",
                        LASTNAME: "",
                        ALIAS: "",
                        EMAIL: "",
                        BIRTHDAYDATE: "",
                        DEPARTMENT: "",
                        FUNCTION: "",
                        STREET: "",
                        CITY: "",
                        STATE: "",
                        POSTALCODE: "",
                        PHONENUMBER: "",
                        COUNTRY: "",
                        ROLES: ""
                    });
                    oDialogModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                    oDialog.setModel(oDialogModel, "UserDialogModel");
                    oDialog.open();
                });
            } else {
                // Si el diálogo ya existe, reinicia el modelo
                //var oModel = this._oUserDialog.getModel("UserDialogModel");
                this._oUserDialog.open();
            }
        },

        onCancelUser: function(){
            if (this._oUserDialog) {
                this._oUserDialog.close();
            }
        },
        onSaveUser: async function() {
            var oDialogModel = this._oUserDialog.getModel("UserDialogModel");
            var oNewUser = oDialogModel.getData();
            console.log("Datos guardados en el modelo local:",oNewUser);
            // Validar datos básicos, por ejemplo:
            if (!oNewUser.FIRSTNAME || !oNewUser.LASTNAME || !oNewUser.EMAIL) {
                MessageToast.show("Por favor, complete los campos obligatorios.");
                return;
            }
            oNewUser.USERNAME = oNewUser.FIRSTNAME + " " + oNewUser.LASTNAME;

            // Enviar datos a la API usando fetch con configuración adecuada:
            try {
                // Enviar la solicitud POST incluyendo
                const response = await fetch("http://localhost:4004/api/sec/usersCRUD?procedure=post", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(oNewUser)
                });
                console.log(response);
                // Puedes verificar el estado de la respuesta o procesar la respuesta:
                if (response.ok) {
                    MessageToast.show("El usuario se ha guardado correctamente.");
                } else {
                    MessageToast.show("Error al guardar el usuario en la base de datos.");
                }

                
            } catch (error) {
                console.error(error);
                MessageToast.show("Error de conexión a la API.");
            }
            
            this._oUserDialog.close();
            MessageToast.show("El usuario se ha guardado correctamente.");
            //this._loadUsersData();
        }
    });
});
