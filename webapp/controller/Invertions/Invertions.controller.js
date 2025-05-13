sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("com.invertions.sapfiorimodinv.controller.Invertions", {
    onInit: function () {
      // Ejemplo de modelo para la tabla
      const oData = {
        items: [
          { supplier: "Jologa", target: "2K USD", date: "Feb 7, 2024", amount: "59K USD" },
          { supplier: "Jologa", target: "30K USD", date: "Mar 7, 2024", amount: "32K USD" },
          { supplier: "DelBont", target: "25K USD", date: "Apr 14, 2024", amount: "20K USD" }
        ]
      };
      this.getView().setModel(new JSONModel(oData));
    }
  });
});
