export const maskCPF = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNPJ = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

export const unmask = (value) => {
    return value.replace(/\D/g, '');
};

// Simple validations
export const validateCPF = (cpf) => {
    cpf = unmask(cpf);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    return rest === parseInt(cpf[10]);
};

export const validateCNPJ = (cnpj) => {
    cnpj = unmask(cnpj);
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    let t = cnpj.length - 2;
    let d = cnpj.substring(0, t);
    let p = cnpj.substring(t);
    let r = 0;
    let s = 1;
    for (let i = t; i >= 1; i--) {
        r += d[t - i] * (s + 1);
        if (++s === 9) s = 1;
    }
    let v = (r % 11) < 2 ? 0 : 11 - (r % 11);
    if (v != p[0]) return false;

    r = 0;
    s = 1;
    for (let i = t + 1; i >= 1; i--) {
        r += d[t - i + 1] * (s + 1);
        if (++s === 9) s = 1;
    }
    v = (r % 11) < 2 ? 0 : 11 - (r % 11);
    return v == p[1];
};
