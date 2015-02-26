$('#rangedate .input-daterange').datepicker({
    clearBtn: true,
    multidate: true,
    todayHighlight: true
});

// Instance the tour
var tour = new Tour({
  steps: [
  {
    element: "#map",
    title: "Title of my step",
    content: "Content of my step"
  },
  {
    element: "#sidebar-dashboard",
    title: "Title of my step",
    content: "Content of my step"
  }
]});

// Initialize the tour
tour.init();

// Start the tour
tour.start();
