import { HeartPulse, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  LegalDocumentPage,
  type LegalDocumentSection,
  type LegalTocGroup,
} from '@/components/legal/legal-document-page'

const listClassName =
  'my-5 ml-5 list-disc space-y-2.5 pl-2 marker:text-brand-600 sm:ml-6'
const orderedListClassName =
  'my-5 ml-5 list-decimal space-y-2.5 pl-2 marker:font-semibold marker:text-brand-700 sm:ml-6'
const linkClassName =
  'font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-800 hover:decoration-brand-600 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

function PrivacyPolicyLink({ label = 'Política de Privacidade do FibroSync' }: { label?: string }) {
  return (
    <Link to="/politica-de-privacidade" className={linkClassName}>
      {label}
    </Link>
  )
}

const termsSections: LegalDocumentSection[] = [
  {
    number: 1,
    title: 'Apresentação',
    content: (
      <>
        <p>
          O FibroSync é uma plataforma digital destinada a auxiliar pessoas que convivem com a
          fibromialgia no acompanhamento de informações relacionadas à sua rotina, sintomas,
          bem-estar e histórico de registros.
        </p>
        <p>
          A plataforma foi desenvolvida para facilitar o registro, a organização e a visualização
          dessas informações, permitindo que o próprio usuário acompanhe sua rotina e, quando
          houver funcionalidades específicas e autorização correspondente, compartilhe
          determinadas informações com profissionais de saúde.
        </p>
        <aside className="my-7 border-l-4 border-brand-500 bg-brand-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <HeartPulse className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <p className="font-medium text-slate-800">
              <strong>O FibroSync possui caráter informativo e de apoio ao acompanhamento pessoal e não
              substitui atendimento, avaliação, diagnóstico ou tratamento realizado por
              profissionais de saúde.</strong>
            </p>
          </div>
        </aside>
        <p>
          Ao criar uma conta, acessar ou utilizar o FibroSync, o usuário declara que leu e
          compreendeu estes Termos de Uso e concorda com suas disposições.
        </p>
        <p>Caso não concorde com estes Termos, o usuário não deverá utilizar a plataforma.</p>
      </>
    ),
  },
  {
    number: 2,
    title: 'Definições',
    content: (
      <>
        <p>Para fins destes Termos:</p>
        <dl className="my-6 space-y-5 border-l border-slate-200 pl-5 sm:pl-6">
          <div>
            <dt className="font-semibold text-slate-900">FibroSync:</dt>
            <dd>
              plataforma digital, incluindo seus sistemas, aplicações, interfaces,
              funcionalidades e serviços disponibilizados aos usuários.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Usuário:</dt>
            <dd>pessoa que cria uma conta ou utiliza os recursos disponibilizados pelo FibroSync.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Paciente/usuário:</dt>
            <dd>
              usuário que utiliza a plataforma para registrar e acompanhar informações
              relacionadas à sua rotina, sintomas e bem-estar.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Profissional:</dt>
            <dd>
              profissional de saúde que utiliza funcionalidades específicas do FibroSync para
              acompanhar usuários, quando essa funcionalidade estiver disponível.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Dados:</dt>
            <dd>
              informações fornecidas pelo usuário ou geradas a partir da utilização da plataforma.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Dados relacionados à saúde:</dt>
            <dd>
              informações inseridas ou registradas na plataforma relacionadas a sintomas, dores,
              sono, bem-estar, rotina ou outras informações relacionadas à saúde do usuário.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Conta:</dt>
            <dd>cadastro individual utilizado para acessar os recursos do FibroSync.</dd>
          </div>
        </dl>
      </>
    ),
  },
  {
    number: 3,
    title: 'Sobre o FibroSync',
    content: (
      <>
        <p>
          O FibroSync é uma ferramenta digital de apoio ao acompanhamento da rotina de pessoas que
          convivem com a fibromialgia.
        </p>
        <p>Dependendo da versão disponibilizada, a plataforma poderá oferecer funcionalidades como:</p>
        <ul className={listClassName}>
          <li>criação e gerenciamento de conta;</li>
          <li>realização de check-ins;</li>
          <li>registro de sintomas e intensidade de dor;</li>
          <li>registro de qualidade do sono;</li>
          <li>registro de humor e energia;</li>
          <li>registro de regiões do corpo;</li>
          <li>registro de possíveis fatores ou situações associados aos sintomas;</li>
          <li>registro de observações pessoais;</li>
          <li>visualização de histórico;</li>
          <li>gráficos e indicadores baseados nos registros realizados;</li>
          <li>identificação de padrões nos dados registrados;</li>
          <li>
            associação de determinados registros com informações contextuais, como condições
            climáticas, quando essa funcionalidade estiver disponível;
          </li>
          <li>
            compartilhamento de informações com profissionais de saúde, mediante as funcionalidades
            e autorizações disponibilizadas;
          </li>
          <li>outras funcionalidades relacionadas ao acompanhamento da rotina.</li>
        </ul>
        <p>
          As funcionalidades poderão ser alteradas, atualizadas, substituídas, suspensas ou
          ampliadas durante a evolução da plataforma.
        </p>
      </>
    ),
  },
  {
    number: 4,
    title: 'Natureza e finalidade da plataforma',
    content: (
      <>
        <p>O FibroSync tem como finalidade auxiliar o usuário a:</p>
        <ul className={listClassName}>
          <li>organizar informações relacionadas à sua rotina;</li>
          <li>registrar sintomas e percepções pessoais;</li>
          <li>acompanhar a evolução dos registros ao longo do tempo;</li>
          <li>visualizar informações históricas;</li>
          <li>identificar padrões existentes nos próprios registros;</li>
          <li>
            facilitar a organização de informações que possam ser posteriormente apresentadas a um
            profissional de saúde.
          </li>
        </ul>
        <p>
          Os recursos apresentados pelo FibroSync devem ser interpretados dentro dessa finalidade.
        </p>
        <p>
          O FibroSync <strong>não deve</strong> ser utilizado como substituto de avaliação profissional ou como
          única fonte para tomada de decisões relacionadas à saúde.
        </p>
      </>
    ),
  },
  {
    number: 5,
    title: 'Não substituição de atendimento médico',
    content: (
      <>
        <p>
          O FibroSync <strong>não é um serviço médico</strong>, não realiza consultas médicas e não
          substitui profissionais de saúde.
        </p>
        <p>A plataforma não substitui:</p>
        <ul className={listClassName}>
          <li>consultas médicas;</li>
          <li>consultas com outros profissionais de saúde;</li>
          <li>exames;</li>
          <li>diagnóstico profissional;</li>
          <li>avaliação clínica;</li>
          <li>tratamento médico;</li>
          <li>acompanhamento terapêutico;</li>
          <li>prescrição médica;</li>
          <li>orientação profissional individualizada.</li>
        </ul>
        <p>
          Informações, gráficos, padrões, indicadores, análises ou insights apresentados pela
          plataforma não constituem diagnóstico, prescrição ou recomendação médica.
        </p>
        <p>O usuário não deverá utilizar informações apresentadas pelo FibroSync para, por conta própria:</p>
        <ul className={listClassName}>
          <li>iniciar ou interromper tratamentos;</li>
          <li>alterar medicamentos;</li>
          <li>alterar dosagens;</li>
          <li>substituir consultas;</li>
          <li>realizar autodiagnóstico;</li>
          <li>tomar decisões médicas de emergência.</li>
        </ul>
        <p>
          Em situações de emergência ou quando houver risco à saúde, o usuário deverá procurar
          imediatamente um serviço de saúde apropriado.
        </p>
      </>
    ),
  },
  {
    number: 6,
    title: 'Informações, padrões e insights',
    content: (
      <>
        <p>
          O FibroSync poderá apresentar informações, gráficos, comparações, padrões ou insights
          derivados dos registros realizados pelo próprio usuário.
        </p>
        <p>
          Essas informações têm caráter <strong>descritivo e informativo</strong>, salvo indicação
          expressa em contrário.
        </p>
        <p>
          Por exemplo, a plataforma poderá identificar que determinados sintomas foram registrados
          com maior frequência em determinados períodos ou em associação com determinadas
          informações registradas pelo usuário.
        </p>
        <p>
          A apresentação de uma associação ou padrão não significa que o FibroSync tenha
          estabelecido uma relação médica de causa e efeito.
        </p>
        <p>
          O usuário deverá interpretar essas informações como apoio à organização e acompanhamento
          de seus próprios registros, e não como conclusão clínica.
        </p>
      </>
    ),
  },
  {
    number: 7,
    title: 'Dados relacionados à saúde',
    content: (
      <>
        <p>
          Durante a utilização do FibroSync, o usuário poderá fornecer informações relacionadas à
          sua saúde, incluindo, entre outras:
        </p>
        <ul className={listClassName}>
          <li>intensidade e localização de dores;</li>
          <li>sintomas;</li>
          <li>qualidade do sono;</li>
          <li>humor;</li>
          <li>nível de energia;</li>
          <li>percepção de bem-estar;</li>
          <li>possíveis fatores associados aos sintomas;</li>
          <li>observações pessoais;</li>
          <li>histórico de registros;</li>
          <li>outras informações inseridas voluntariamente pelo usuário.</li>
        </ul>
        <aside className="my-7 border border-brand-200 bg-brand-50/60 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <div className="space-y-3">
              <p className="font-medium text-slate-800">
                Algumas dessas informações podem ser consideradas dados pessoais sensíveis,
                especialmente quando relacionadas à saúde, nos termos da legislação aplicável.
              </p>
              <p>
                O tratamento dessas informações será realizado de acordo com as finalidades
                informadas ao usuário e com a legislação aplicável de proteção de dados pessoais.
              </p>
            </div>
          </div>
        </aside>
        <p>
          As informações detalhadas sobre coleta, finalidade, utilização, armazenamento,
          compartilhamento, retenção, eliminação e direitos dos titulares deverão constar na{' '}
          <PrivacyPolicyLink />.
        </p>
      </>
    ),
  },
  {
    number: 8,
    title: 'Conta e cadastro',
    content: (
      <>
        <p>Determinadas funcionalidades poderão exigir a criação de uma conta.</p>
        <p>Ao realizar o cadastro, o usuário deverá:</p>
        <ul className={listClassName}>
          <li>fornecer informações verdadeiras, completas e atualizadas;</li>
          <li>utilizar seus próprios dados;</li>
          <li>manter suas informações cadastrais atualizadas;</li>
          <li>proteger suas credenciais de acesso;</li>
          <li>não compartilhar sua senha ou mecanismos de autenticação com terceiros;</li>
          <li>comunicar ao FibroSync qualquer suspeita de acesso não autorizado.</li>
        </ul>
        <p>
          Cada conta deverá ser utilizada pelo respectivo titular, salvo quando uma funcionalidade
          específica permitir expressamente outro tipo de acesso.
        </p>
        <p>
          O FibroSync poderá adotar mecanismos de segurança, autenticação e verificação de identidade
          ou de vínculo profissional conforme a evolução da plataforma.
        </p>
      </>
    ),
  },
  {
    number: 9,
    title: 'Responsabilidade pelas informações inseridas',
    content: (
      <>
        <p>O usuário é responsável pelas informações que inserir voluntariamente na plataforma.</p>
        <p>
          O usuário deverá buscar fornecer informações corretas e atualizadas, especialmente quando
          essas informações forem utilizadas para acompanhamento pessoal ou compartilhadas com
          profissionais.
        </p>
        <p>O FibroSync não garante a exatidão das informações fornecidas pelo usuário.</p>
        <p>
          O usuário também deverá evitar inserir dados pessoais de terceiros quando isso não for
          necessário para a utilização da plataforma.
        </p>
      </>
    ),
  },
  {
    number: 10,
    title: 'Compartilhamento com profissionais de saúde',
    content: (
      <>
        <p>
          Quando a funcionalidade estiver disponível, o FibroSync poderá permitir que o usuário
          compartilhe determinadas informações com profissionais de saúde.
        </p>
        <p>
          O compartilhamento deverá ocorrer por meio dos mecanismos disponibilizados pela plataforma
          e de acordo com as autorizações e configurações escolhidas pelo usuário.
        </p>
        <p>
          O acesso de um profissional aos dados do usuário não deverá ser interpretado como
          autorização geral e irrestrita para acesso a todas as informações existentes na
          plataforma, devendo ser observados os limites definidos pelas funcionalidades disponíveis.
        </p>
        <p>
          Quando aplicável, o usuário poderá cancelar ou revogar o compartilhamento por meio dos
          recursos disponibilizados pela plataforma.
        </p>
        <p>
          O profissional que receber informações por meio do FibroSync também poderá estar sujeito
          às suas próprias obrigações profissionais, legais, éticas e de proteção de dados.
        </p>
      </>
    ),
  },
  {
    number: 11,
    title: 'Uso de dados para pesquisas e estudos',
    content: (
      <>
        <p>
          O FibroSync poderá, futuramente, desenvolver iniciativas relacionadas a pesquisas, estudos,
          análises estatísticas ou produção de conhecimento sobre fibromialgia e temas relacionados.
        </p>
        <p>
          Qualquer utilização adicional de dados para essas finalidades deverá observar a legislação
          aplicável e as bases legais correspondentes.
        </p>
        <p>
          A simples utilização do FibroSync não deverá ser interpretada automaticamente como
          autorização para que dados pessoais ou dados relacionados à saúde sejam comercializados ou
          compartilhados indiscriminadamente com terceiros.
        </p>
        <p>
          Quando uma finalidade específica exigir autorização, consentimento ou outro mecanismo de
          manifestação do titular, esse procedimento deverá ser realizado separadamente, de acordo
          com a legislação aplicável e com as informações fornecidas ao usuário.
        </p>
      </>
    ),
  },
  {
    number: 12,
    title: 'Não comercialização indiscriminada dos dados',
    content: (
      <>
        <p>
          O FibroSync não concede a terceiros um direito geral de acesso, exploração ou utilização
          dos dados dos usuários.
        </p>
        <p>
          Qualquer compartilhamento ou utilização de dados deverá possuir finalidade definida e
          observar a legislação aplicável, a <PrivacyPolicyLink label="Política de Privacidade" /> e,
          quando necessário, as
          autorizações específicas do usuário.
        </p>
        <p>
          O FibroSync não deverá utilizar estes Termos de Uso como autorização genérica para
          comercializar dados pessoais identificáveis dos usuários.
        </p>
      </>
    ),
  },
  {
    number: 13,
    title: 'Privacidade e proteção de dados',
    content: (
      <>
        <p>
          O tratamento de dados pessoais realizado pelo FibroSync deverá observar a legislação
          aplicável, incluindo a{' '}
          <strong>Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)</strong>.
        </p>
        <p>
          A <PrivacyPolicyLink /> deverá apresentar informações específicas sobre:
        </p>
        <ul className={listClassName}>
          <li>dados coletados;</li>
          <li>fontes dos dados;</li>
          <li>finalidades do tratamento;</li>
          <li>bases legais aplicáveis;</li>
          <li>armazenamento;</li>
          <li>período de retenção;</li>
          <li>compartilhamento;</li>
          <li>operadores e prestadores de serviços;</li>
          <li>direitos dos titulares;</li>
          <li>procedimentos para solicitações;</li>
          <li>segurança;</li>
          <li>eliminação de dados;</li>
          <li>demais informações relevantes relacionadas ao tratamento de dados pessoais.</li>
        </ul>
        <p>
          A <PrivacyPolicyLink label="Política de Privacidade" /> integra a documentação do
          FibroSync e deverá ser disponibilizada ao usuário em local de fácil acesso.
        </p>
      </>
    ),
  },
  {
    number: 14,
    title: 'Segurança das informações',
    content: (
      <>
        <p>
          O FibroSync deverá adotar medidas técnicas e administrativas compatíveis com a natureza dos
          dados tratados para reduzir riscos de:
        </p>
        <ul className={listClassName}>
          <li>acesso não autorizado;</li>
          <li>perda;</li>
          <li>alteração indevida;</li>
          <li>destruição;</li>
          <li>divulgação não autorizada;</li>
          <li>utilização indevida das informações.</li>
        </ul>
        <p>
          As medidas de segurança poderão incluir mecanismos de autenticação, controle de acesso,
          proteção de credenciais, criptografia em trânsito, segregação de permissões, monitoramento
          e outras medidas técnicas ou administrativas aplicáveis à arquitetura da plataforma.
        </p>
        <p>
          Nenhum sistema conectado à internet pode ser considerado absolutamente seguro. Dessa
          forma, não é possível garantir a inexistência absoluta de incidentes de segurança.
        </p>
        <p>
          Quando aplicável, incidentes deverão ser tratados conforme os procedimentos internos e a
          legislação pertinente.
        </p>
      </>
    ),
  },
  {
    number: 15,
    title: 'Responsabilidade pelo acesso à conta',
    content: (
      <>
        <p>O usuário é responsável pela proteção de suas credenciais de acesso.</p>
        <p>Não será permitido:</p>
        <ul className={listClassName}>
          <li>compartilhar intencionalmente sua conta com terceiros;</li>
          <li>utilizar a conta de outra pessoa sem autorização;</li>
          <li>tentar obter credenciais de outros usuários;</li>
          <li>permitir acesso não autorizado à própria conta.</li>
        </ul>
        <p>
          Caso identifique atividade suspeita, perda de credenciais ou acesso não autorizado, o
          usuário deverá comunicar o FibroSync pelos canais oficiais disponibilizados.
        </p>
      </>
    ),
  },
  {
    number: 16,
    title: 'Uso adequado da plataforma',
    content: (
      <>
        <p>
          O usuário concorda em utilizar o FibroSync de maneira legal, ética e compatível com estes
          Termos.
        </p>
        <p>É proibido:</p>
        <ul className={listClassName}>
          <li>utilizar a plataforma para fins ilícitos;</li>
          <li>tentar acessar contas de terceiros;</li>
          <li>tentar acessar dados que não estejam autorizados ao usuário;</li>
          <li>explorar vulnerabilidades de segurança de forma indevida;</li>
          <li>interferir deliberadamente no funcionamento da plataforma;</li>
          <li>introduzir códigos maliciosos;</li>
          <li>realizar ataques, testes ou varreduras não autorizadas contra a infraestrutura;</li>
          <li>utilizar mecanismos automatizados de maneira abusiva;</li>
          <li>copiar ou reproduzir indevidamente elementos protegidos da plataforma;</li>
          <li>utilizar informações de outros usuários sem autorização;</li>
          <li>
            praticar qualquer atividade que possa comprometer a segurança ou disponibilidade do
            FibroSync.
          </li>
        </ul>
        <p>
          Pesquisas de segurança responsáveis poderão ser realizadas somente de acordo com eventuais
          políticas específicas disponibilizadas pelo FibroSync.
        </p>
      </>
    ),
  },
  {
    number: 17,
    title: 'Propriedade intelectual',
    content: (
      <>
        <p>
          O FibroSync e seus elementos poderão ser protegidos pela legislação aplicável de
          propriedade intelectual.
        </p>
        <p>Isso inclui, quando aplicável:</p>
        <ul className={listClassName}>
          <li>nome FibroSync;</li>
          <li>marca;</li>
          <li>logotipo;</li>
          <li>identidade visual;</li>
          <li>interface;</li>
          <li>textos;</li>
          <li>componentes visuais;</li>
          <li>código-fonte;</li>
          <li>arquitetura de software;</li>
          <li>funcionalidades;</li>
          <li>bancos de dados estruturados pelo FibroSync;</li>
          <li>documentação;</li>
          <li>materiais produzidos especificamente para a plataforma.</li>
        </ul>
        <p>A utilização do FibroSync não concede ao usuário propriedade sobre esses elementos.</p>
        <p>
          Salvo autorização expressa, o usuário não poderá copiar, reproduzir, modificar, distribuir,
          comercializar ou explorar indevidamente elementos protegidos da plataforma.
        </p>
      </>
    ),
  },
  {
    number: 18,
    title: 'Conteúdo fornecido pelo usuário',
    content: (
      <>
        <p>
          O usuário mantém seus direitos sobre os conteúdos e informações que fornecer ao FibroSync,
          observadas as disposições legais aplicáveis.
        </p>
        <p>
          Ao inserir informações na plataforma, o usuário permite que o FibroSync realize o
          tratamento necessário para disponibilizar as funcionalidades solicitadas, observadas as
          finalidades informadas e a legislação aplicável.
        </p>
        <p>
          Essa autorização não representa transferência automática da propriedade dos dados pessoais
          para o FibroSync.
        </p>
        <p>
          O tratamento das informações deverá observar a{' '}
          <PrivacyPolicyLink label="Política de Privacidade" /> e as demais regras aplicáveis.
        </p>
      </>
    ),
  },
  {
    number: 19,
    title: 'Integrações e serviços de terceiros',
    content: (
      <>
        <p>
          O FibroSync poderá utilizar serviços, APIs, provedores de infraestrutura, armazenamento,
          autenticação, hospedagem, monitoramento ou outras tecnologias fornecidas por terceiros.
        </p>
        <p>Esses serviços poderão ser necessários para o funcionamento da plataforma.</p>
        <p>
          Quando o tratamento de dados pessoais por terceiros ocorrer em nome do FibroSync, deverão
          ser observadas as responsabilidades e obrigações aplicáveis aos respectivos agentes de
          tratamento.
        </p>
        <p>
          O usuário reconhece que serviços de terceiros podem possuir seus próprios termos, políticas
          e condições de utilização.
        </p>
      </>
    ),
  },
  {
    number: 20,
    title: 'Disponibilidade da plataforma',
    content: (
      <>
        <p>O FibroSync poderá passar por períodos de:</p>
        <ul className={listClassName}>
          <li>manutenção;</li>
          <li>atualização;</li>
          <li>correção de falhas;</li>
          <li>alterações de infraestrutura;</li>
          <li>indisponibilidade temporária;</li>
          <li>melhorias de segurança;</li>
          <li>atualizações de funcionalidades.</li>
        </ul>
        <p>
          Serão adotadas medidas razoáveis para manter a plataforma disponível, porém não é possível
          garantir disponibilidade contínua ou ausência absoluta de falhas.
        </p>
        <p>
          O FibroSync poderá suspender temporariamente determinados recursos quando necessário para
          manutenção, segurança ou proteção da plataforma.
        </p>
      </>
    ),
  },
  {
    number: 21,
    title: 'Alterações das funcionalidades',
    content: (
      <>
        <p>O FibroSync está em processo contínuo de desenvolvimento.</p>
        <p>Por esse motivo, determinadas funcionalidades poderão:</p>
        <ul className={listClassName}>
          <li>ser adicionadas;</li>
          <li>modificadas;</li>
          <li>substituídas;</li>
          <li>temporariamente suspensas;</li>
          <li>descontinuadas.</li>
        </ul>
        <p>Alterações relevantes poderão ser comunicadas aos usuários pelos canais disponíveis.</p>
      </>
    ),
  },
  {
    number: 22,
    title: 'Limitação de responsabilidade',
    content: (
      <>
        <p>O FibroSync deverá ser utilizado como ferramenta de apoio ao acompanhamento pessoal.</p>
        <p>
          Na medida permitida pela legislação aplicável, o FibroSync não será responsável por
          decisões médicas tomadas pelo usuário ou por terceiros exclusivamente com base nas
          informações apresentadas pela plataforma.
        </p>
        <p>O usuário permanece responsável por procurar atendimento profissional adequado quando necessário.</p>
        <p>
          O FibroSync também não garante que os registros realizados pelo usuário serão suficientes
          para representar integralmente sua condição de saúde.
        </p>
        <p>
          Nenhuma funcionalidade da plataforma deverá ser interpretada como garantia de prevenção,
          diagnóstico, tratamento ou cura da fibromialgia.
        </p>
      </>
    ),
  },
  {
    number: 23,
    title: 'Encerramento ou suspensão da conta',
    content: (
      <>
        <p>
          O usuário poderá solicitar o encerramento de sua conta pelos mecanismos disponibilizados
          pelo FibroSync.
        </p>
        <p>O FibroSync também poderá suspender ou encerrar uma conta quando houver:</p>
        <ul className={listClassName}>
          <li>violação destes Termos;</li>
          <li>utilização ilícita da plataforma;</li>
          <li>tentativa de comprometimento da segurança;</li>
          <li>fraude;</li>
          <li>acesso não autorizado;</li>
          <li>utilização que represente risco relevante para outros usuários ou para a plataforma;</li>
          <li>determinação legal ou regulatória.</li>
        </ul>
        <p>
          Sempre que adequado e juridicamente possível, o usuário poderá ser informado sobre a
          suspensão ou encerramento.
        </p>
      </>
    ),
  },
  {
    number: 24,
    title: 'Exclusão e retenção de dados',
    content: (
      <>
        <p>
          O encerramento da conta não significa necessariamente que todos os dados serão imediatamente
          eliminados.
        </p>
        <p>Determinadas informações poderão precisar ser mantidas pelo período necessário para:</p>
        <ul className={listClassName}>
          <li>cumprimento de obrigações legais ou regulatórias;</li>
          <li>exercício regular de direitos;</li>
          <li>prevenção de fraude;</li>
          <li>segurança;</li>
          <li>cumprimento de determinações de autoridades competentes;</li>
          <li>outras hipóteses permitidas pela legislação aplicável.</li>
        </ul>
        <p>
          As regras específicas de retenção e eliminação deverão ser apresentadas na{' '}
          <PrivacyPolicyLink />.
        </p>
      </>
    ),
  },
  {
    number: 25,
    title: 'Direitos do titular',
    content: (
      <>
        <p>
          O usuário, na condição de titular de dados pessoais, poderá exercer os direitos previstos
          na legislação aplicável, observados os requisitos e limitações legais.
        </p>
        <p>Entre esses direitos poderão estar:</p>
        <ul className={listClassName}>
          <li>confirmação da existência de tratamento;</li>
          <li>acesso aos dados;</li>
          <li>correção de informações;</li>
          <li>informações sobre compartilhamento;</li>
          <li>eliminação, quando aplicável;</li>
          <li>portabilidade, quando aplicável;</li>
          <li>revogação de consentimento, quando essa for a base legal utilizada;</li>
          <li>demais direitos previstos pela legislação.</li>
        </ul>
        <p>
          As solicitações deverão ser realizadas por meio do canal de privacidade disponibilizado
          pelo FibroSync.
        </p>
      </>
    ),
  },
  {
    number: 26,
    title: 'Comunicações',
    content: (
      <>
        <p>O FibroSync poderá enviar comunicações relacionadas ao funcionamento da plataforma, incluindo:</p>
        <ul className={listClassName}>
          <li>avisos de segurança;</li>
          <li>alterações relevantes;</li>
          <li>atualizações;</li>
          <li>manutenção;</li>
          <li>recuperação de conta;</li>
          <li>notificações relacionadas às funcionalidades utilizadas.</li>
        </ul>
        <p>
          Comunicações promocionais, quando existentes, deverão observar as regras aplicáveis e os
          mecanismos de opt-out disponibilizados.
        </p>
      </>
    ),
  },
  {
    number: 27,
    title: 'Alterações destes Termos',
    content: (
      <>
        <p>Estes Termos poderão ser atualizados para refletir:</p>
        <ul className={listClassName}>
          <li>alterações nas funcionalidades;</li>
          <li>mudanças na operação do FibroSync;</li>
          <li>alterações legislativas;</li>
          <li>mudanças nos procedimentos de segurança;</li>
          <li>evolução da plataforma;</li>
          <li>alterações nos serviços disponibilizados.</li>
        </ul>
        <p>
          Quando houver alterações relevantes, o FibroSync deverá comunicar os usuários pelos meios
          disponíveis.
        </p>
        <p>A versão vigente deverá permanecer disponível para consulta.</p>
        <p>
          Quando a legislação exigir nova manifestação de concordância, o FibroSync adotará o
          procedimento correspondente.
        </p>
      </>
    ),
  },
  {
    number: 28,
    title: 'Legislação aplicável',
    content: (
      <>
        <p>
          Estes Termos deverão ser interpretados de acordo com a legislação aplicável da República
          Federativa do Brasil.
        </p>
        <p>
          As disposições destes Termos não afastam direitos assegurados ao usuário pela legislação
          brasileira.
        </p>
      </>
    ),
  },
  {
    number: 29,
    title: 'Canal de contato',
    content: (
      <>
        <p>
          Para dúvidas, solicitações, reclamações ou assuntos relacionados ao funcionamento da
          plataforma, o usuário poderá utilizar:
        </p>
        <dl className="my-6 grid gap-x-6 gap-y-3 border-y border-slate-200 py-5 sm:grid-cols-[11rem_1fr]">
          <dt className="font-semibold text-slate-900">FibroSync:</dt>
          <dd>FIBROSYNC INOVA SIMPLES (I.S.)</dd>
          <dt className="font-semibold text-slate-900">CNPJ:</dt>
          <dd>66.126.229/0001-85</dd>
          <dt className="font-semibold text-slate-900">E-mail:</dt>
          <dd>
            <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
              fibrosync@gmail.com
            </a>
          </dd>
          <dt className="font-semibold text-slate-900">E-mail de privacidade:</dt>
          <dd>
            <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
              fibrosync@gmail.com
            </a>
          </dd>
        </dl>
        <p>
          Solicitações relacionadas à proteção de dados pessoais deverão ser direcionadas ao canal
          de privacidade indicado pelo FibroSync.
        </p>
      </>
    ),
  },
  {
    number: 30,
    title: 'Aceitação',
    content: (
      <>
        <p>Ao criar uma conta, acessar ou utilizar o FibroSync, o usuário declara que:</p>
        <ol className={orderedListClassName}>
          <li>leu estes Termos de Uso;</li>
          <li>compreendeu suas disposições;</li>
          <li>concorda com as condições apresentadas;</li>
          <li>está ciente de que o FibroSync possui caráter informativo e de apoio;</li>
          <li>compreende que a plataforma não substitui atendimento profissional de saúde;</li>
          <li>
            compreende que determinadas funcionalidades poderão envolver o tratamento de informações
            relacionadas à saúde;
          </li>
          <li>
            reconhece que o tratamento de seus dados pessoais será disciplinado também pela{' '}
            <PrivacyPolicyLink />.
          </li>
        </ol>
        <p>
          Caso não concorde com estes Termos, o usuário deverá interromper a utilização da plataforma.
        </p>
      </>
    ),
  },
]

const tocGroups: LegalTocGroup[] = [
  { label: 'Sobre o FibroSync', sectionNumbers: [1, 2, 3, 4] },
  { label: 'Saúde e informações apresentadas', sectionNumbers: [5, 6, 7] },
  { label: 'Conta e utilização', sectionNumbers: [8, 9, 10, 15, 16] },
  { label: 'Dados e privacidade', sectionNumbers: [11, 12, 13, 14, 24, 25] },
  { label: 'Plataforma e propriedade', sectionNumbers: [17, 18, 19, 20, 21] },
  { label: 'Responsabilidades e encerramento', sectionNumbers: [22, 23] },
  { label: 'Disposições finais', sectionNumbers: [26, 27, 28, 29, 30] },
]

export function TermsOfUsePage() {
  return (
    <LegalDocumentPage
      documentTitle="Termos de Uso | FibroSync"
      title="Termos de Uso"
      intro={
        <p className="max-w-2xl">
          Bem-vindo ao FibroSync. Nesta página, você encontra as condições que orientam o acesso e a
          utilização da plataforma, incluindo informações sobre funcionalidades, responsabilidades,
          privacidade, segurança e direitos dos usuários. Recomendamos a leitura integral deste
          documento antes de utilizar nossos serviços.
        </p>
      }
      lastUpdated="30 de setembro de 2026"
      lastUpdatedDateTime="2026-09-30"
      sections={termsSections}
      tocGroups={tocGroups}
      tocAriaLabel="Índice dos Termos de Uso"
      navigationAriaLabel="Navegação dos Termos de Uso"
      currentPath="/termos-de-uso"
    />
  )
}
