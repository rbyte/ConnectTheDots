// draw a number

var div = document.createElement("div");
document.body.appendChild(div);
div.style.color = "#0f0";
div.style.font = "100px Helvetica";


// add a responder

db.addResponder({
	// respond to changes in the "attachments" collection
	from:"attachments", f:function (item,event) {
		// if the variable we care about changed
		if (item.name === "hit count" && item.type === "variable") {
			// update the number with the variable's value
			div.innerHTML = item.data;
		}
	}
});



////////////////


// In the attachments, to the left, notice the variable named "hit count".
// If you click on the attachment, you can observe it live, or set it manually.

function incrementHitCount () {
	// find the variable attachment.
	// In this case, we're saying "find an attachment named 'hit count' that is attached to self".
	// If you don't know what object it's attached to, you could omit the "object_id" specifier for a global search.
	var variable = db.findOne("attachments", { name:"hit count", object_id:db.self_id });

	// The variable's data is stored in its "data" property.
	var value = variable.data;

	// Increment the value and set it.
	db.set(variable._id, { data: value + 1 });
}

db.addResponder({
	from:"lasered objects", f:function (item,event) {
		if (item.object_id === db.self_id && event === "create") {
			incrementHitCount();
		}
	}
});

