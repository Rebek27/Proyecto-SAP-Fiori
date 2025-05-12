/* eslint-disable linebreak-style */
/* eslint-disable no-console */
/* eslint-disable fiori-custom/sap-no-hardcoded-url */
/* eslint-disable fiori-custom/sap-no-localhost */
sap.ui.define([
    "com/invertions/sapfiorimodinv/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log"
], function(BaseController,JSONModel,Log){
    "use strict";

    return BaseController.extend("com.ccnay.ficsapfioriwebsales.controller.Users.UsersList",{
        onInit: function(){
            const oRolesModel = new JSONModel();
            this.getView().setModel(oRolesModel, "users");

            const oSelectedUserModel = new JSONModel();

            this.getView().setModel(oSelectedUserModel, "selectedUser");

            this._loadUsersData();
        },

        _loadUsersData: async function(){
            try {
                const response = await fetch("http://localhost:4004/api/sec/usersCRUD?procedure=getall");
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
        }
        // onNavBack: function () {
        //     // Obtener la instancia del History
        //     var oHistory = sap.ui.core.routing.History.getInstance();
        //     var sPreviousHash = oHistory.getPreviousHash();

        //     // Si existe una ruta previa, vuelve a ella
        //     if (sPreviousHash !== undefined) {
        //         window.history.go(-1);
        //     } else {
        //         // Si no hay historial, navegar a una ruta por defecto (por ejemplo, "home")
        //         var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        //         oRouter.navTo("home", {}, true);
        //     }
        // }
    });
});