
  /**
   **  PROCESS QUEUE
   **  Tucker Bickler 11/14/2012
   **/

function Queue() {
  var self = this;

  self.jobs = [];
  self.running = false;
}

Queue.prototype.addJob = function() {
  var self = this;

  self.jobs.push(Array.prototype.slice.call(arguments));

  if (!self.running) {
    self.running = true;
    self.runJobs();
  }
}

Queue.prototype.runJobs = function() {
  var self = this;

  if (self.jobs.length === 0) {
    self.running = false;
    return;
  }

  self.jobs[0].push(function() {
    self.jobs.shift();
    self.runJobs();
  });

  var job = self.jobs[0].shift();
  job.apply(this, self.jobs[0]);
}



module.exports = new Queue();