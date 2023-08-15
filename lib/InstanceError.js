class InstanceError extends TypeError {
  constructor(instance, expectedSuperClassName) {
    const superClass = Object.prototype.toString.call(instance).split(' ').pop().slice(0, -1);

    super(`Expected ${expectedSuperClassName} but received ${superClass}`);

    this.name = 'InstanceError';
  }
}

export default InstanceError;
