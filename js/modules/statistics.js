define(["chart"], function(Chart) {

	var Statistics = {}, App;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */
	
	Statistics.initialize = function() {

		App = require("app");
		var updateTimeout;

		// Update statistics once the window size hasn't changed for 100ms
		$(window).on("resize", function() {
			window.clearTimeout(updateTimeout);
			updateTimeout = window.setTimeout(Statistics.updateView, 100);
		});
	};

	/* ================= */
	/* ====== GET ====== */
	/* ================= */

	Statistics.get = function(callback) {
		App.DB.getData("App", "Statistics", null, function(data) {
			callback(data);
		});
	};

	Statistics.updateView = function() {

		var display_note = true;

		// Get all statistics
		App.Statistics.get(function(data) {

			var stackdata = [];

			// Sort them into their own stack array
			[].forEach.call(data, function(v) {
				if (!stackdata[v.value.stackID]) { stackdata[v.value.stackID] = []; }
				stackdata[v.value.stackID].push(v);
			});

			if (display_note) { App.$("#page-statistics").find(".note").show(); }

			// Now fetch the stack name and process the data
			for (stackID in stackdata) {
				App.Stacks.getName(+stackID, function(stackname, id) {

					var data = stackdata[id];

					// Not enough data to generate proper statistics
					if (data.length < 2) { return; }

					// Hide the note
					if (display_note) {
						App.$("#page-statistics").find("[data-role=content]").html("");
						display_note = false;
					}

					// Create canvas
					var ctx = document.createElement("canvas").getContext("2d");
					ctx.canvas.width = $("body").width() - 100;
					ctx.canvas.height = Math.round(ctx.canvas.width / 1.618);

					// Insert heading and canvas
					App.$("#page-statistics").find("[data-role=content]").append("<h1>" + stackname + "</h1><hr>");
					App.$("#page-statistics").find("[data-role=content]").append(ctx.canvas);
					App.$("#page-statistics").find("[data-role=content]").append("<hr class='transparent'>");

					// Define chart variables
					var labels = [], datasets = [{

						fillColor: "#777",
						strokeColor: "#333",
						data: [],
						label: "foo"

					}], max_scale = 0;

					// Fill labels and datasets
					data.forEach(function(v) {
						var date = new Date(v.value.timestamp);
						labels.push("".split.call(date, " ").slice(0, 3).join(" "));

						datasets[0].data.push(v.value.score);
						max_scale = v.value.total > max_scale ? v.value.total : max_scale;
					});

					// Create the chart
					var chart = new Chart(ctx).Line({ labels: labels, datasets: datasets }, {
						scaleOverride: true,
						scaleSteps: max_scale,
						scaleStepWidth: 1,
						scaleStartValue: 0,
						scaleLabel: "<%=value%> Cards",
						datasetStrokeWidth: 5,
						animation: false
					});
				});
			}
		});
	};

	/* ======================================= */
	/* ====== REGISTER PRACTICE SESSION ====== */
	/* ======================================= */

	Statistics.registerPracticeSession = function(id, score, total) {
		App.DB.addData("App", "Statistics", {
			stackID: +id,
			score: score,
			total: total,
			timestamp: new Date().getTime()
		});
	};

	return Statistics;
});