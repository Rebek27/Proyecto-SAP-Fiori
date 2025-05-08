sap.ui.define([
  "com/invertions/sapfiorimodinv/controller/BaseController",
  "sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("com.invertions.sapfiorimodinv.controller.Values", {
      onInit: function() {
          // Usa la vista para acceder al modelo
          this.getView().setModel(new JSONModel({
              values: []
          }), "values");
      },

      loadValues: function(aValues) {
          // Accede siempre a través de la vista
          var oView = this.getView();
          
          // Actualiza el modelo
          oView.getModel("values").setData({
              values: aValues
          });
          
          // Accede a elementos UI
          var oTable = oView.byId("valuesTable");
          if (oTable) {
              oTable.setVisible(true);
          } else {
              console.error("Elemento con ID 'i' no encontrado en la vista");
          }
      }
  });
});